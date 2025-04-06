import { generateContentSitemap } from "@/utils";
import { IvolunteerPageTagsEnum } from "@/types/enums";

export async function GET() {
	return await generateContentSitemap(IvolunteerPageTagsEnum.EVENT);
}
