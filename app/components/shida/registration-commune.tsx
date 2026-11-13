import type {SelectHTMLAttributes} from "react";
import {addressCopy} from "../../lib/registration/address-copy";
import type {RegistrationLocale} from "../../lib/registration/copy";

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "value"> & {
  locale: RegistrationLocale; value: string; communes: readonly string[];
};

export function RegistrationCommune({locale, communes, value, ...props}: Props) {
  return <select {...props} value={value}>
    <option value="">{addressCopy[locale].choose}</option>
    {value && !communes.includes(value) && <option>{value}</option>}
    {communes.map(name => <option key={name}>{name}</option>)}
  </select>;
}
