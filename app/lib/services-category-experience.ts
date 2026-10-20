import contract from "./services-category-experience.json";
export type ServiceLocale="en"|"fr"|"ln"|"sw";
export type ServiceCategoryExperience={service:string;description:string;request:string};
/** Generated contract copy from Backend app/models/service_category_experience.json.
 * Presentation only; category publication and booking policy remain server-owned.
 */
export function serviceCategoryExperience(category:string|undefined,locale:ServiceLocale):ServiceCategoryExperience|undefined{
 if(!category||!Object.prototype.hasOwnProperty.call(contract.categories,category))return undefined;
 return contract.categories[category as keyof typeof contract.categories][locale];
}
