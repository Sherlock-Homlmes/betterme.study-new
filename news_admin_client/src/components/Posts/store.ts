import { useRuntimeConfig } from "nuxt/app";
import { ref } from "vue";
import { createInjectionState } from "@vueuse/core";
import type { GetPostListResponse } from "@types/responses";

export const [useProvidePostListStore, usePostListStore] = createInjectionState(
	() => {
		// config
		const config = useRuntimeConfig();
		const { fetchLink } = config.public;

		// state
		const posts = ref<GetPostListResponse[]>([]);
		const loading = ref(false);
		// const deleteDialog = ref<boolean>(false);
		// const confirmDeletePostValue = ref<string>("");
		// const deletePost = ref<GetPostListResponse>();

		// getters

		// actions
		const getPostList = async () => {
			loading.value = true;
			const postsResult = await fetch(`${fetchLink}/posts?per_page=10000`);
			posts.value = (await postsResult.json()) as GetPostListResponse[];
			loading.value = false;
		};
		// const onClickDeletePost = (post: GetPostListResponse) => {
		//     deletePost.value = post
		//     deleteDialog.value = true
		// }

		// const onDeletePostConfirm = async (deletePost: GetPostListResponse) => {
		//     try{
		//         await fetchWithAuth(
		//             `${fetchLink}/admin/posts/${deletePost.id}`,{method: 'DELETE'}
		//         )
		//         posts.value = posts.value.filter(post => post.id !== deletePost.id)
		//     }
		//     catch(err){
		//         console.error(err)
		//     }
		//     finally{
		//         deleteDialog.value = false
		//     }
		// }

		return {
			// state
			posts,
			loading,
			// getters
			// actions
			getPostList,
		};
	},
);
