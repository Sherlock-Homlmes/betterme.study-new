import { useRuntimeConfig } from "nuxt/app";
import { ref, getCurrentInstance } from "vue";
import { createInjectionState } from "@vueuse/core";
import { fetchWithAuth } from "@utils/betterFetch";
import { isEmpty } from "lodash";
import type {
	GetCrawlersIvolunteerDataResponse,
	PostCrawlersPreviewDiscordDataPayload,
	PostCrawlersDataPayload,
	PostCrawlersResponse,
	PostAIPromtPayload,
} from "@types/responses";
import {
	CrawlerDataResponseTypeEnum,
	OriginCrawlPagesEnum,
	IvolunteerPageTagsEnum,
	IvolunteerPageContentTypeEnum,
	AIPromtTypeEnum,
} from "@types/enums";
import { changeTracker } from "@utils/func";

const contentTypeMap = {
	// [IvolunteerPageContentTypeEnum.CLUB]: IvolunteerPageTagsEnum.CLUB,
	[IvolunteerPageContentTypeEnum.VOLUNTEER]: IvolunteerPageTagsEnum.VOLUNTEER,
	[IvolunteerPageContentTypeEnum.SCHORLARSHIP]:
		IvolunteerPageTagsEnum.SCHORLARSHIP,
	[IvolunteerPageContentTypeEnum.COURSE]: IvolunteerPageTagsEnum.COURSE,
	[IvolunteerPageContentTypeEnum.EVENT]: IvolunteerPageTagsEnum.EVENT,
};

export const [useProvideCrawlerIvolunteerStore, useCrawlerIvolunteerStore] =
	createInjectionState((link: string) => {
		// config
		const config = useRuntimeConfig();
		const { fetchLink } = config.public;
		const vm = getCurrentInstance().proxy as any;

		// state
		const pageInfo = ref<GetCrawlersIvolunteerDataResponse>();
		const shouldCreateSocialMediaPost = ref<boolean>(false);
		const updating = ref<Boolean>(false);
		const aiPrompt = ref({
			title: null,
			description: null,
			content: null,
			loading: false,
		});
		const tags = ref<IvolunteerPageTagsEnum[]>(
			Object.values(IvolunteerPageTagsEnum),
		);
		const snackbar = ref<Boolean>(false);

		// getters
		const isPostCreated = computed(() => !!pageInfo.value.id);
		const canSave = computed<Boolean>(
			() =>
				!isPostCreated.value &&
				!updating.value &&
				pageInfo.value &&
				!pageInfo.value.id &&
				pageInfo.value.title.length &&
				pageInfo.value.description.length &&
				pageInfo.value.content.length &&
				pageInfo.value.tags.length,
		);

		// actions
		const getPageInfo = async () => {
			try {
				const postResult = await fetchWithAuth(
					`${fetchLink}/admin/crawlers/${link}?origin=ivolunteer_vn`,
				);
				if (!postResult.ok) throw new Error("Crawler fail");
				pageInfo.value =
					(await postResult.json()) as GetCrawlersIvolunteerDataResponse;
				if (pageInfo.value.id) vm.$router.push(`/posts/${pageInfo.value.id}`);
				changeTracker.track(pageInfo.value);
				pageInfo.value.tags = [
					contentTypeMap[
						vm.$route.query.content_type as IvolunteerPageContentTypeEnum
					],
				];
			} catch {
				window.alert("Crawler fail");
			}
		};

		const onValidate = async () => {
			const validateElements = [
				"title",
				// 'tags'
			];
			for (const ele of validateElements) {
				if ((await vm.$refs[ele].validate()).length) {
					window.alert(`Invalid ${ele}`);
					return false;
				}
			}
			return true;
		};

		const onSaveDraft = async (showAlert: boolean = false) => {
			if (!(await onValidate())) return;

			const updateFields = changeTracker.getChange(pageInfo.value);
			if (isEmpty(updateFields)) return;
			try {
				updating.value = true;
				const response = await fetchWithAuth(
					`${fetchLink}/admin/crawlers/${link}`,
					{
						method: "PATCH",
						body: JSON.stringify(updateFields),
					},
				);
				if (!response.ok) throw new Error("UPDATE FAIL");
				if (showAlert) window.alert("Update success");
				return true;
			} catch {
				window.alert("UPDATE FAIL");
				return false;
			} finally {
				updating.value = false;
			}
		};

		const onCreatePost = async () => {
			if (!(await onSaveDraft())) return;
			try {
				updating.value = true;
				const response = await fetchWithAuth(`${fetchLink}/admin/crawlers`, {
					method: "POST",
					body: JSON.stringify({
						origin: OriginCrawlPagesEnum.IVOLUNTEER_VN,
						post_name: link.toString(),
						should_create_facebook_post: shouldCreateSocialMediaPost.value,
					} as PostCrawlersDataPayload),
				});
				if (!response.ok) throw new Error("CREATE FAIL");
				const response_data = (await response.json()) as PostCrawlersResponse;
				pageInfo.value.id = response_data["id"];
				snackbar.value = true;
			} catch {
				window.alert("CREATE FAIL");
			} finally {
				updating.value = false;
			}
		};

		const onAIPromptGenerate = async (
			context: "title" | "description" | "content",
			promtType: AIPromtTypeEnum,
		) => {
			try {
				aiPrompt.value.loading = true;
				const response = await fetchWithAuth(
					`${fetchLink}/admin/ai/post_prompts`,
					{
						method: "POST",
						body: JSON.stringify({
							context,
							prompt_type: promtType,
						} as PostAIPromtPayload),
					},
				);
				aiPrompt.value[promtType] = (await response.json()).data;
			} finally {
				aiPrompt.value.loading = false;
			}
		};

		const onDiscordPreview = async () => {
			if (!(await onSaveDraft())) return;
			updating.value = true;
			await fetchWithAuth(`${fetchLink}/admin/crawlers/${link}/_preview`, {
				method: "POST",
				body: JSON.stringify({
					origin: OriginCrawlPagesEnum.IVOLUNTEER_VN,
					preview_source: [CrawlerDataResponseTypeEnum.DISCORD],
				} as PostCrawlersPreviewDiscordDataPayload),
			});
			updating.value = false;
		};
		const onHtmlPreview = () => {
			updating.value = true;
			//
			updating.value = false;
		};
		const onFacebookPreview = () => {
			updating.value = true;
			//
			updating.value = false;
		};
		const onTitleChanged = (event: string) => {
			// Auto uppercase first letter of every words in title
			pageInfo.value.title = event
				.split(" ")
				.map((ele: string) => ele.charAt(0).toUpperCase() + ele.slice(1))
				.join(" ");
		};

		const onKeywordChanged = (event: string[]) => {
			const uniqueKeywords = new Set(
				event.map((keyword: string) => keyword.toLowerCase()),
			);
			pageInfo.value.keywords = Array.from(uniqueKeywords);
		};

		return {
			// state
			pageInfo,
			shouldCreateSocialMediaPost,
			updating,
			aiPrompt,
			tags,
			snackbar,
			// getters
			canSave,
			// actions
			getPageInfo,
			onSaveDraft,
			onCreatePost,
			onAIPromptGenerate,
			onDiscordPreview,
			onHtmlPreview,
			onFacebookPreview,
			onTitleChanged,
			onKeywordChanged,
		};
	});
