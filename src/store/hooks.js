import { useDispatch, useSelector } from 'react-redux';

// ----------------------------------------------------------------------

/**
 * Typed Redux Hooks
 * 
 * Use these hooks instead of plain useDispatch/useSelector
 * for better TypeScript support (when migrating to TS)
 */

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

