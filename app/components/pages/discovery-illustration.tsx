/** Hand-authored vectors, decorative beside their descriptive entry headings. */
export function DiscoveryIllustration({ kind }: { kind: "school" | "business" }) {
  return <svg className="discovery-illustration" viewBox="0 0 280 200" fill="none" aria-hidden="true" focusable="false">
    <path d="M24 167C3 124 26 39 85 24c49-12 54 16 97 12 70-6 98 97 58 132Z" fill={kind === "school" ? "#ede3c5" : "#dbe8dd"}/>
    <path d="M24 171h235" stroke="#8c9e8e" strokeWidth="2" strokeLinecap="round"/>
    {kind === "school" ? <>
      <path d="M61 78h161v91H61z" fill="#fffdf4" stroke="#224f40" strokeWidth="2"/>
      <path d="m46 80 95-48 95 48Z" fill="#224f40"/>
      <path d="m121 80 20-12 21 12v89h-41z" fill="#dfc47e"/>
      <path d="M132 129a9 9 0 0 1 18 0v40h-18z" fill="#224f40"/>
      <g fill="#83aa97" stroke="#224f40" strokeWidth="2"><path d="M77 96h25v23H77zM180 96h25v23h-25zM77 133h25v23H77zM180 133h25v23h-25z"/></g>
      <path d="M89 96v23m103-23v23M77 107h25m78 0h25" stroke="#fffdf4" strokeWidth="2"/>
      <circle cx="141" cy="91" r="9" fill="#fffdf4"/><path d="M141 85v7l5 3" stroke="#224f40" strokeWidth="2"/>
      <path d="M142 33V16m1 0h26l-5 8 5 8h-26" stroke="#224f40" strokeWidth="2" fill="#c89e49"/>
      <path d="M36 170v-39m0 13c-26-3-18-31 0-28 18-21 33 14 0 28" fill="#719781" stroke="#224f40" strokeWidth="2"/>
      <path d="M194 174c10-7 19-7 29-1 10-6 19-6 29 1v15c-10-6-19-6-29 0-10-6-19-6-29 0Z" fill="#fffdf4" stroke="#224f40" strokeWidth="2"/><path d="M223 173v16" stroke="#224f40" strokeWidth="2"/>
    </> : <>
      <rect x="103" y="39" width="129" height="91" rx="6" fill="#fffdf4" stroke="#224f40" strokeWidth="2"/>
      <path d="M103 57h129" stroke="#224f40" strokeWidth="2"/><g fill="#c89e49"><circle cx="114" cy="48" r="2"/><circle cx="122" cy="48" r="2"/><circle cx="130" cy="48" r="2"/></g>
      <path d="M119 73h42m-42 10h28m-28 10h34" stroke="#9eada0" strokeWidth="4" strokeLinecap="round"/>
      <path d="M175 108V92h10v16m7 0V81h10v27m7 0V70h10v38" fill="#83aa97"/>
      <path d="M169 111h55" stroke="#224f40" strokeWidth="2"/>
      <path d="M49 169v-47c0-18 10-30 28-30s27 12 27 30v47" fill="#224f40"/>
      <circle cx="77" cy="72" r="20" fill="#ae7650"/><path d="M57 71c-5-24 35-34 41-7l-18-6-23 13Z" fill="#203a30"/>
      <path d="m72 94 7 22 8-22" fill="#fffdf4"/><path d="m96 120 18 22h33" stroke="#ae7650" strokeWidth="13" strokeLinecap="round"/>
      <path d="M31 150h211m-196 0v21m181-21v21" stroke="#86643e" strokeWidth="6" strokeLinecap="round"/>
      <path d="m137 113 65 0-12 35h-65Z" fill="#b6cbbd" stroke="#224f40" strokeWidth="2"/><circle cx="165" cy="130" r="4" fill="#fffdf4"/>
      <path d="M223 148v-24m0 9c-19 0-24-27-5-20 2-21 26-13 18 3-2 8-7 13-13 17Z" fill="#719781" stroke="#224f40" strokeWidth="2"/>
    </>}
  </svg>;
}
