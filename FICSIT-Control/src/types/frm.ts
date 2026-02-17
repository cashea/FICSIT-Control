export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface FRMConnection {
  url: string;
  status: ConnectionStatus;
  lastUpdate: number | null;
  error: string | null;
}

// FRM API response types

export interface FRMPowerCircuit {
  CircuitGroupID: number;
  PowerProduction: number;
  PowerConsumed: number;
  PowerCapacity: number;
  PowerMaxConsumed: number;
  BatteryInput: number;
  BatteryOutput: number;
  BatteryDifferential: number;
  BatteryPercent: number;
  BatteryCapacity: number;
  BatteryTimeEmpty: string;
  BatteryTimeFull: string;
  FuseTriggered: boolean;
}

export interface FRMProdStat {
  Name: string;
  ClassName: string;
  ProdPerMin: string;
  ProdPercent: number;
  ConsPercent: number;
  CurrentProd: number;
  MaxProd: number;
  CurrentConsumed: number;
  MaxConsumed: number;
  Type: string;
}

export interface FRMInventoryItem {
  Name: string;
  ClassName: string;
  Amount: number;
  MaxAmount: number;
}

export interface FRMStorageContainer {
  Name: string;
  ClassName: string;
  location: { x: number; y: number; z: number };
  Inventory: FRMInventoryItem[];
}

export interface FRMMachine {
  Name: string;
  ClassName: string;
  location: { x: number; y: number; z: number };
  Recipe: string;
  RecipeClassName: string;
  Production: Array<{
    Name: string;
    ClassName: string;
    Amount: number;
    CurrentProd: number;
    MaxProd: number;
    ProdPercent: number;
  }>;
  Ingredients: Array<{
    Name: string;
    ClassName: string;
    Amount: number;
    CurrentConsumed: number;
    MaxConsumed: number;
    ConsPercent: number;
  }>;
  IsProducing: boolean;
  IsPaused: boolean;
  CircuitGroupID: number;
  PowerInfo: {
    CircuitGroupID: number;
    PowerConsumed: number;
    MaxPowerConsumed: number;
  };
}

export interface FRMPlayer {
  Name: string;
  ClassName: string;
  location: { x: number; y: number; z: number };
  PlayerHP: number;
}

export interface FRMGeneratorFuel {
  Name: string;
  ClassName: string;
  EnergyValue: number;
}

export interface FRMGenerator {
  ID: string;
  Name: string;
  ClassName: string;
  location: { x: number; y: number; z: number; rotation: number };
  CircuitID: number;
  BaseProd: number;
  DynamicProdCapacity: number;
  RegulatedDemandProd: number;
  IsFullBlast: boolean;
  CanStart: boolean;
  CurrentPotential: number;
  PowerProductionPotential: number;
  FuelAmount: number;
  FuelResource: number;
  NuclearWarning: string;
  GeoMinPower: number;
  GeoMaxPower: number;
  AvailableFuel: FRMGeneratorFuel[];
  Supplement: {
    Name: string;
    ClassName: string;
    CurrentConsumed: number;
    MaxConsumed: number;
    PercentFull: number;
  };
}
