import { describe, it, expect, beforeEach } from "vitest";
import { useLocationsStore } from "../locations-store";

describe("locations-store", () => {
  beforeEach(() => {
    useLocationsStore.setState({ locations: [] });
  });

  it("initializes with no locations", () => {
    expect(useLocationsStore.getState().locations).toHaveLength(0);
  });

  it("adds a location with a generated id", () => {
    useLocationsStore.getState().addLocation({ name: "Base", x: 100, y: 200, z: 300 });
    const { locations } = useLocationsStore.getState();
    expect(locations).toHaveLength(1);
    expect(locations[0].name).toBe("Base");
    expect(locations[0].x).toBe(100);
    expect(locations[0].y).toBe(200);
    expect(locations[0].z).toBe(300);
    expect(typeof locations[0].id).toBe("string");
    expect(locations[0].id.length).toBeGreaterThan(0);
  });

  it("adds multiple locations independently", () => {
    useLocationsStore.getState().addLocation({ name: "Alpha", x: 1, y: 2, z: 3 });
    useLocationsStore.getState().addLocation({ name: "Beta", x: 4, y: 5, z: 6 });
    const { locations } = useLocationsStore.getState();
    expect(locations).toHaveLength(2);
    expect(locations[0].name).toBe("Alpha");
    expect(locations[1].name).toBe("Beta");
    expect(locations[0].id).not.toBe(locations[1].id);
  });

  it("removes a location by id", () => {
    useLocationsStore.getState().addLocation({ name: "To Delete", x: 0, y: 0, z: 0 });
    const { locations } = useLocationsStore.getState();
    const id = locations[0].id;
    useLocationsStore.getState().removeLocation(id);
    expect(useLocationsStore.getState().locations).toHaveLength(0);
  });

  it("removes only the targeted location", () => {
    useLocationsStore.getState().addLocation({ name: "Keep", x: 1, y: 1, z: 1 });
    useLocationsStore.getState().addLocation({ name: "Delete", x: 2, y: 2, z: 2 });
    const { locations } = useLocationsStore.getState();
    const deleteId = locations[1].id;
    useLocationsStore.getState().removeLocation(deleteId);
    const after = useLocationsStore.getState().locations;
    expect(after).toHaveLength(1);
    expect(after[0].name).toBe("Keep");
  });

  it("updates location name", () => {
    useLocationsStore.getState().addLocation({ name: "Old Name", x: 0, y: 0, z: 0 });
    const { locations } = useLocationsStore.getState();
    const id = locations[0].id;
    useLocationsStore.getState().updateLocationName(id, "New Name");
    expect(useLocationsStore.getState().locations[0].name).toBe("New Name");
  });

  it("does not change coordinates when updating name", () => {
    useLocationsStore.getState().addLocation({ name: "Test", x: 10, y: 20, z: 30 });
    const { locations } = useLocationsStore.getState();
    const id = locations[0].id;
    useLocationsStore.getState().updateLocationName(id, "Renamed");
    const updated = useLocationsStore.getState().locations[0];
    expect(updated.x).toBe(10);
    expect(updated.y).toBe(20);
    expect(updated.z).toBe(30);
  });

  it("ignores removeLocation with unknown id", () => {
    useLocationsStore.getState().addLocation({ name: "Stay", x: 0, y: 0, z: 0 });
    useLocationsStore.getState().removeLocation("nonexistent-id");
    expect(useLocationsStore.getState().locations).toHaveLength(1);
  });
});
