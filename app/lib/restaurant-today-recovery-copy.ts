const fr={summaryLimit:'Le résumé des commandes est indisponible pour le moment. Consultez les commandes ou réessayez plus tard.',intakeUnknown:'État de réception des nouvelles commandes indisponible.',retryWait:'Réessayer dans {seconds} s'};
type Copy={[K in keyof typeof fr]:string};
const en:Copy={summaryLimit:'The order summary is currently unavailable. View orders or try again later.',intakeUnknown:'New order intake status is unavailable.',retryWait:'Try again in {seconds}s'};
const ln:Copy={summaryLimit:'Bokuse ya bakomande ezali te sikoyo. Tala bakomande to meka lisusu nsima.',intakeUnknown:'Etat ya koyamba bakomande ya sika eyebani te.',retryWait:'Meka lisusu nsima ya {seconds} s'};
const sw:Copy={summaryLimit:'Muhtasari wa maagizo haupatikani kwa sasa. Angalia maagizo au ujaribu tena baadaye.',intakeUnknown:'Hali ya kupokea maagizo mapya haipatikani.',retryWait:'Jaribu tena baada ya sekunde {seconds}'};
export const todayRecoveryCopy={fr,en,ln,sw};
