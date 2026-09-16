import { Types } from "mongoose";
import CreativeAsset, { ICreativeAsset } from "../../models/CreativeAsset";
import ContentItem from "../../models/ContentItem";
import { assertOrganizationMembership } from "../../middleware/organization.middleware";
import { ContentItemNotFoundError, InvalidContentStudioInputError } from "./errors";

/**
 * GET /api/content-studio/assets/:contentItemId takes only the item id (per
 * the roadmap's endpoint contract) - the item itself carries
 * organizationId/contentPlanId, so it's looked up directly rather than
 * requiring the caller to also supply plan/org ids. `userId` is verified
 * to belong to that organization before any assets are returned.
 */
export async function listAssetsForContentItem(userId: string, contentItemId: string): Promise<ICreativeAsset[]> {
  if (!contentItemId || !Types.ObjectId.isValid(contentItemId)) {
    throw new InvalidContentStudioInputError("contentItemId is missing or invalid");
  }

  const item = await ContentItem.findById(contentItemId);
  if (!item) {
    throw new ContentItemNotFoundError(contentItemId);
  }

  await assertOrganizationMembership(userId, item.organizationId.toString());

  const assets = await CreativeAsset.find({ contentItemId: item._id }).sort({ createdAt: -1 });
  // Preserve legacy records, but ensure consumers encounter rendered MP4
  // videos before historical storyboard manifests.
  return assets.sort((a, b) => Number(isRealVideo(b)) - Number(isRealVideo(a)));
}

function isRealVideo(asset: ICreativeAsset): boolean {
  return asset.type === "video" && asset.metadata?.isMock !== true && asset.mimeType === "video/mp4" && Boolean(asset.url);
}
