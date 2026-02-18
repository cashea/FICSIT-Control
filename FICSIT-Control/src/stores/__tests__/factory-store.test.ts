import { describe, it, expect, beforeEach, vi } from "vitest";
import { useFactoryStore } from "../factory-store";
import type { FRMPowerCircuit } from "../../types";

describe("factory-store", () => {
  beforeEach(() => {
    // Reset the store to initial state between tests
    useFactoryStore.getState().reset();
  });

  describe("setPowerCircuits", () => {
    it("adds power snapshot with current timestamp", () => {
      const mockCircuit: FRMPowerCircuit = {
        CircuitGroupID: 1,
        PowerProduction: 100,
        PowerConsumed: 50,
        PowerCapacity: 150,
      } as FRMPowerCircuit;

      useFactoryStore.getState().setPowerCircuits([mockCircuit]);
      
      const state = useFactoryStore.getState();
      expect(state.powerHistory[1]).toHaveLength(1);
      expect(state.powerHistory[1][0].production).toBe(100);
      expect(state.powerHistory[1][0].consumed).toBe(50);
      expect(state.powerHistory[1][0].capacity).toBe(150);
      expect(state.powerHistory[1][0].time).toBeGreaterThan(0);
    });

    it("prevents timestamps from going backward", () => {
      const mockCircuit: FRMPowerCircuit = {
        CircuitGroupID: 1,
        PowerProduction: 100,
        PowerConsumed: 50,
        PowerCapacity: 150,
      } as FRMPowerCircuit;

      // Mock Date.now to control timestamps
      const now = Date.now();
      const dateNowSpy = vi.spyOn(Date, "now");
      
      // First snapshot at time T
      dateNowSpy.mockReturnValue(now);
      useFactoryStore.getState().setPowerCircuits([mockCircuit]);
      
      // Attempt to add snapshot at same time T (should be rejected)
      dateNowSpy.mockReturnValue(now);
      useFactoryStore.getState().setPowerCircuits([{
        ...mockCircuit,
        PowerConsumed: 60,
      } as FRMPowerCircuit]);
      
      const state1 = useFactoryStore.getState();
      expect(state1.powerHistory[1]).toHaveLength(1);
      expect(state1.powerHistory[1][0].consumed).toBe(50); // Original value preserved
      
      // Attempt to add snapshot at earlier time T-1000 (should be rejected)
      dateNowSpy.mockReturnValue(now - 1000);
      useFactoryStore.getState().setPowerCircuits([{
        ...mockCircuit,
        PowerConsumed: 70,
      } as FRMPowerCircuit]);
      
      const state2 = useFactoryStore.getState();
      expect(state2.powerHistory[1]).toHaveLength(1);
      expect(state2.powerHistory[1][0].consumed).toBe(50); // Still original value
      
      // Add snapshot at later time T+3000 (should succeed)
      dateNowSpy.mockReturnValue(now + 3000);
      useFactoryStore.getState().setPowerCircuits([{
        ...mockCircuit,
        PowerConsumed: 80,
      } as FRMPowerCircuit]);
      
      const state3 = useFactoryStore.getState();
      expect(state3.powerHistory[1]).toHaveLength(2);
      expect(state3.powerHistory[1][0].consumed).toBe(50);
      expect(state3.powerHistory[1][1].consumed).toBe(80);
      expect(state3.powerHistory[1][1].time).toBeGreaterThan(state3.powerHistory[1][0].time);
      
      dateNowSpy.mockRestore();
    });

    it("respects minimum snapshot interval", () => {
      const mockCircuit: FRMPowerCircuit = {
        CircuitGroupID: 1,
        PowerProduction: 100,
        PowerConsumed: 50,
        PowerCapacity: 150,
      } as FRMPowerCircuit;

      const now = Date.now();
      const dateNowSpy = vi.spyOn(Date, "now");
      
      // First snapshot
      dateNowSpy.mockReturnValue(now);
      useFactoryStore.getState().setPowerCircuits([mockCircuit]);
      
      // Snapshot 1 second later (< 2s interval, should be rejected)
      dateNowSpy.mockReturnValue(now + 1000);
      useFactoryStore.getState().setPowerCircuits([{
        ...mockCircuit,
        PowerConsumed: 60,
      } as FRMPowerCircuit]);
      
      const state1 = useFactoryStore.getState();
      expect(state1.powerHistory[1]).toHaveLength(1);
      
      // Snapshot 2.5 seconds later (>= 2s interval, should succeed)
      dateNowSpy.mockReturnValue(now + 2500);
      useFactoryStore.getState().setPowerCircuits([{
        ...mockCircuit,
        PowerConsumed: 70,
      } as FRMPowerCircuit]);
      
      const state2 = useFactoryStore.getState();
      expect(state2.powerHistory[1]).toHaveLength(2);
      expect(state2.powerHistory[1][1].consumed).toBe(70);
      
      dateNowSpy.mockRestore();
    });

    it("maintains chronological order in history", () => {
      const mockCircuit: FRMPowerCircuit = {
        CircuitGroupID: 1,
        PowerProduction: 100,
        PowerConsumed: 50,
        PowerCapacity: 150,
      } as FRMPowerCircuit;

      const now = Date.now();
      const dateNowSpy = vi.spyOn(Date, "now");
      
      // Add multiple snapshots
      for (let i = 0; i < 5; i++) {
        dateNowSpy.mockReturnValue(now + i * 3000);
        useFactoryStore.getState().setPowerCircuits([{
          ...mockCircuit,
          PowerConsumed: 50 + i * 10,
        } as FRMPowerCircuit]);
      }
      
      const state = useFactoryStore.getState();
      expect(state.powerHistory[1]).toHaveLength(5);
      
      // Verify timestamps are strictly increasing
      for (let i = 1; i < state.powerHistory[1].length; i++) {
        expect(state.powerHistory[1][i].time).toBeGreaterThan(
          state.powerHistory[1][i - 1].time
        );
      }
      
      dateNowSpy.mockRestore();
    });

    it("limits history to MAX_HISTORY entries", () => {
      const mockCircuit: FRMPowerCircuit = {
        CircuitGroupID: 1,
        PowerProduction: 100,
        PowerConsumed: 50,
        PowerCapacity: 150,
      } as FRMPowerCircuit;

      const now = Date.now();
      const dateNowSpy = vi.spyOn(Date, "now");
      
      // Add 125 snapshots (more than MAX_HISTORY = 120)
      for (let i = 0; i < 125; i++) {
        dateNowSpy.mockReturnValue(now + i * 3000);
        useFactoryStore.getState().setPowerCircuits([mockCircuit]);
      }
      
      const state = useFactoryStore.getState();
      expect(state.powerHistory[1]).toHaveLength(120);
      
      dateNowSpy.mockRestore();
    });

    it("handles multiple circuits independently", () => {
      const circuit1: FRMPowerCircuit = {
        CircuitGroupID: 1,
        PowerProduction: 100,
        PowerConsumed: 50,
        PowerCapacity: 150,
      } as FRMPowerCircuit;

      const circuit2: FRMPowerCircuit = {
        CircuitGroupID: 2,
        PowerProduction: 200,
        PowerConsumed: 150,
        PowerCapacity: 250,
      } as FRMPowerCircuit;

      useFactoryStore.getState().setPowerCircuits([circuit1, circuit2]);
      
      const state = useFactoryStore.getState();
      expect(state.powerHistory[1]).toHaveLength(1);
      expect(state.powerHistory[2]).toHaveLength(1);
      expect(state.powerHistory[1][0].production).toBe(100);
      expect(state.powerHistory[2][0].production).toBe(200);
    });
  });

  describe("reset", () => {
    it("clears all state", () => {
      const mockCircuit: FRMPowerCircuit = {
        CircuitGroupID: 1,
        PowerProduction: 100,
        PowerConsumed: 50,
        PowerCapacity: 150,
      } as FRMPowerCircuit;

      useFactoryStore.getState().setPowerCircuits([mockCircuit]);
      useFactoryStore.getState().reset();
      
      const state = useFactoryStore.getState();
      expect(state.powerCircuits).toHaveLength(0);
      expect(Object.keys(state.powerHistory)).toHaveLength(0);
    });
  });
});
