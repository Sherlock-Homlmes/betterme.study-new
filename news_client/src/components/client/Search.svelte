<script lang="ts">
	import SearchIcon from '@/clientComponents/SearchIcon'
	import Modal from './Modal.svelte'
	import { clientFetchLink } from 'src/utils/config'
	import { debounce } from 'src/utils/minLodash'
	import type { GetPostListResponse } from '@/types/responses'
	import { IvolunteerPageTagsEnum } from '@/types/enums'

	interface IOption {
		id: any
		value: string
	}
	const tagsData = Object.values(IvolunteerPageTagsEnum)
	let options: IOption[] = [
		{ id: null, text: 'Tất cả' },
		...tagsData.map((tag) => ({ id: tag, text: tag })),
	]
	let selected: IOption
	let previousSelected: IOption

	let showModal: boolean = false
	let loading: boolean = false
	let results: GetPostListResponse[] = []
	let searchContextModel: string = ''
	$: searchContext = searchContextModel.trim()
	let previousSearchContext: string = ''
	let shouldShowMoreButton: boolean = false

	const searchPosts = async () => {
		if (!searchContext.length) {
			results = []
			return
		}
		if (searchContext === previousSearchContext && selected === previousSelected) {
			loading = false
			return
		}

		const searchParams = {
			per_page: 20,
			match_search: searchContext,
		}
		if (selected && selected.id) searchParams.match_tags = selected.id

		try {
			const res = await fetch(`${clientFetchLink}/posts?${new URLSearchParams(searchParams)}`)
			if (!res.ok) new Error('API error')
			const posts = await res.json()
			previousSearchContext = searchContext
			previousSelected = selected
			results = posts
			if (results.length >= 20) shouldShowMoreButton = true
			// TODO: fail to check header
			// const totalPostsCount: number = parseInt(res.headers.get('x-total-count'))
			// if (totalPostsCount > 20) shouldShowMoreButton = true
		} catch (e) {
			console.log(e)
		} finally {
			loading = false
		}
	}
</script>

<button
	class="flex items-center justify-center rounded-md gap-1"
	on:click={() => (showModal = true)}
>
	<SearchIcon />
</button>

<Modal bind:showModal>
	<div class="flex">
		<select
			id="states"
			class="max-w-fit bg-gray-200 border border-2 border-black text-gray-900 text-sm rounded-s-lg dark:border-s-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
			bind:value={selected}
			on:change={debounce(searchPosts, 850)}
		>
			{#each options as option}
				<option
					value={option}
					class="inline-flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
				>
					{option.text}
				</option>
			{/each}
		</select>
		<input
			autofocus
			class="h-12 w-full px-4 border-2 border-l-0 rounded-e-lg border-black"
			type="text"
			placeholder="Search"
			bind:value={searchContextModel}
			on:input={debounce(searchPosts, 850)}
			on:input={() => {
				if (searchContext.length) loading = true
				else {
					results = []
					loading = false
				}
			}}
		/>
	</div>
	{#if loading}
		<h3 class="my-4 pl-2">Tìm kiếm kết quả cho "{searchContext}"...</h3>
	{:else if !loading && !results.length && searchContext.length}
		<h3 class="my-4 pl-2">Không có kết quả cho "{searchContext}"</h3>
	{:else if !loading && results.length}
		<h3 class="mt-4 pl-2 text-xl font-bold">Kết quả cho "{searchContext}"</h3>
		<ol class="definition-list mt-5">
			{#each results as post}
				<li class="mb-2">
					<a
						class="flex flex-col items-center bg-white border border-gray-200 rounded-lg md:flex-row hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
						target="_blank"
						rel="noreferrer"
						href="posts/{post.id}"
					>
						<img
							class="object-cover w-full rounded-t-lg h-96 md:h-auto md:w-48 md:rounded-none md:rounded-s-lg"
							src={post.banner_img}
							alt=""
						/>
						<div class="flex flex-col justify-between p-4 leading-normal">
							<span class="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
								{post.title}
							</span>
						</div>
					</a>
				</li>
			{/each}
		</ol>
		{#if shouldShowMoreButton}
			<div class="flex justify-center">
				<a href={`/search?match_search=${searchContext}`} class="mt-3">
					<button
						class="bg-black text-white p-3 rounded-full mb-4 dark:text-black dark:bg-white text-underline hover:scale-105"
					>
						Hiển thị thêm
					</button>
				</a>
			</div>
		{/if}
	{:else if !loading}
		<div class="mb-8"></div>
	{/if}
</Modal>
