'use client';

import {useEffect, useRef} from 'react';
import {subscribeStatisticsConsent,websiteStatistics} from '../../lib/website-statistics-consent';

export function EmployerPageView({reference}: {reference:string}) {
  const observed = useRef('');
  useEffect(() => {
    function observe() {
      const statistics=websiteStatistics();
      if(statistics?.consent()!=='accepted'){observed.current='';return;}
      if (document.visibilityState !== 'visible' || observed.current === reference) return;
      observed.current = reference;
      statistics.employer(reference);
    }
    const unsubscribe=subscribeStatisticsConsent(observe);
    observe();
    document.addEventListener('visibilitychange',observe);
    return () => {unsubscribe();document.removeEventListener('visibilitychange',observe);};
  },[reference]);
  return null;
}
