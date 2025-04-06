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
