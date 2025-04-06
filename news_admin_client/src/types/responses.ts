/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface CrawlerListParams {
	origin: string;
	page?: number;
}
export interface CrawlersDataParams {
	origin: string;
	use_cache?: boolean;
}
export interface CrawlersListDataParams {
	origin: string;
	page?: number;
	content_type: string;
}
export interface GetCrawlersIvolunteerDataResponse {
	id?: string;
	title: string;
	description: string;
	tags: string[];
	banner: string;
	deadline?: string;
	content: string;
	keywords: string[];
}
export interface GetCrawlersKhoahocTvDataResponse {
	title: string;
	description: string;
	tags: string[];
	banner: string;
	thumbnail: string;
	content: string;
	keywords: string[];
}
export interface GetDraftPostListResponse {
	id: string;
	source: string;
	name: string;
	original_data: GetCrawlersIvolunteerDataResponse;
	draft_data: GetCrawlersIvolunteerDataResponse;
	post?: string;
}
export interface GetTagsParams {
	origin: string;
}
export interface OtherPostInfo {
	deadline?: string;
}
export interface PatchBotPayload {
	action: string;
}
export interface PatchCrawlersDataPayload {
	title?: string;
	description?: string;
	banner?: string;
	content?: string;
	/**
	 * @minItems 1
	 */
	tags?: [string, ...string[]];
	/**
	 * @minItems 1
	 */
	keywords?: [string, ...string[]];
}
export interface PatchPostPayload {
	title?: string;
	description?: string;
	banner?: string;
	other_information?: OtherPostInfo;
	content?: string;
	/**
	 * @minItems 1
	 */
	tags?: [string, ...string[]];
	/**
	 * @minItems 1
	 */
	keywords?: [string, ...string[]];
}
export interface PostAIPromtPayload {
	prompt_type: string;
	context: string;
}
export interface PostCrawlersDataPayload {
	origin: string;
	post_name: string;
	should_create_facebook_post?: boolean;
}
export interface PostCrawlersPreviewDiscordDataPayload {
	origin: string;
	preview_source: string[];
}
export interface PostCrawlersResponse {
	id: string;
}
export interface PostPostPayload {
	title?: string;
	description?: string;
	banner: string;
	deadline?: string;
	content?: string;
	/**
	 * @minItems 1
	 */
	tags?: [string, ...string[]];
	/**
	 * @minItems 1
	 */
	keywords?: [string, ...string[]];
}
/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface GetPostListParams {
	page?: number;
	per_page?: number;
	match_tags?: string;
	match_search?: string;
}
export interface GetPostListResponse {
	id: string;
	slug?: string;
	updated_at?: string;
	created_at: string;
	title: string;
	description: string;
	thumbnail_img?: string;
	banner_img?: string;
	tags: string[];
	keywords: string[];
	view: number;
}
export interface GetPostParams {
	increase_view?: boolean;
}
export interface GetPostResponse {
	id: string;
	created_at: string;
	updated_at: string;
	title: string;
	slug?: string;
	description: string;
	thumbnail_img?: string;
	banner_img?: string;
	content: string;
	author: string;
	author_link?: string;
	other_information?: OtherPostInfo;
	view: number;
	tags: string[];
	keywords: string[];
	og_img: string;
}
export interface OtherPostInfo {
	deadline?: string;
}
