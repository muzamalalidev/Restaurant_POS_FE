'use client';

import { useMemo, useState, useContext, createContext } from 'react';

// ----------------------------------------------------------------------

const NavBackContext = createContext({ navBack: null, setNavBack: () => {} });

export function NavBackProvider({ children }) {
  const [navBack, setNavBack] = useState(null);
  const value = useMemo(() => ({ navBack, setNavBack }), [navBack]);

  return <NavBackContext.Provider value={value}>{children}</NavBackContext.Provider>;
}

export function useNavBack() {
  return useContext(NavBackContext);
}
