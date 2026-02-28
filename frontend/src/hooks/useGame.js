import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';

export function useGame() {
  const [state, setState] = useState(null);
  const [upgrades, setUpgrades] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const localState = useRef(null);

  const fetchState = useCallback(async () => {
    try {
      const [gameState, upgradeList] = await Promise.all([
        api.getState(),
        api.getUpgrades(),
      ]);
      localState.current = {
        gold: parseFloat(gameState.gold),
        wood: parseFloat(gameState.wood),
        stone: parseFloat(gameState.stone),
      };
      setState(gameState);
      setUpgrades(upgradeList);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchState(); }, [fetchState]);

  // Local tick every 100ms for smooth UI
  useEffect(() => {
    if (!state) return;
    const interval = setInterval(() => {
      if (!localState.current) return;
      localState.current.gold += state.goldPerSec / 10;
      localState.current.wood += state.woodPerSec / 10;
      localState.current.stone += state.stonePerSec / 10;
      setState(prev => ({
        ...prev,
        gold: Math.floor(localState.current.gold),
        wood: Math.floor(localState.current.wood),
        stone: Math.floor(localState.current.stone),
      }));
    }, 100);
    return () => clearInterval(interval);
  }, [state?.goldPerSec, state?.woodPerSec, state?.stonePerSec]);

  // Server sync every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const gameState = await api.getState();
        localState.current = {
          gold: parseFloat(gameState.gold),
          wood: parseFloat(gameState.wood),
          stone: parseFloat(gameState.stone),
        };
        setState(gameState);
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const buyUpgrade = useCallback(async (upgradeId) => {
    try {
      const newState = await api.buyUpgrade(upgradeId);
      localState.current = {
        gold: parseFloat(newState.gold),
        wood: parseFloat(newState.wood),
        stone: parseFloat(newState.stone),
      };
      setState(newState);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, []);

  const doPrestige = useCallback(async () => {
    try {
      const newState = await api.prestige();
      localState.current = { gold: 0, wood: 0, stone: 0 };
      setState(newState);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, []);

  // Called by WorldMap after a travel to update state immediately
  const updateState = useCallback((newState) => {
    localState.current = {
      gold: parseFloat(newState.gold),
      wood: parseFloat(newState.wood),
      stone: parseFloat(newState.stone),
    };
    setState(newState);
  }, []);

  return { state, upgrades, error, loading, buyUpgrade, doPrestige, updateState, refetch: fetchState };
}
