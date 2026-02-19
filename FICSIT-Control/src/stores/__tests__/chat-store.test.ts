import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "../chat-store";

describe("chat-store", () => {
  beforeEach(() => {
    // Reset the store to initial state between tests
    const state = useChatStore.getState();
    state.clearMessages();
    state.setDraftMessage(null);
  });

  describe("setDraftMessage", () => {
    it("sets a draft message", () => {
      const draftText = "Test draft message";
      useChatStore.getState().setDraftMessage(draftText);
      
      const state = useChatStore.getState();
      expect(state.draftMessage).toBe(draftText);
    });

    it("clears draft message when set to null", () => {
      useChatStore.getState().setDraftMessage("Test draft");
      useChatStore.getState().setDraftMessage(null);
      
      const state = useChatStore.getState();
      expect(state.draftMessage).toBeNull();
    });

    it("updates draft message when called multiple times", () => {
      useChatStore.getState().setDraftMessage("First draft");
      useChatStore.getState().setDraftMessage("Second draft");
      
      const state = useChatStore.getState();
      expect(state.draftMessage).toBe("Second draft");
    });
  });
});
