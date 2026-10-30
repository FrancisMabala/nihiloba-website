import type {ReactNode} from 'react';
export function AccountSetting({title,status,children}:{title:string;status?:string;children:ReactNode}){
 return <details className="space-security-setting"><summary><span>{title}</span>{status&&<small>{status}</small>}</summary><div className="space-security-detail">{children}</div></details>;
}
