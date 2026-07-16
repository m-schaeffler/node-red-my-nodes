// Matter Enums

class OperationalStateEnum {
    static 0x00 = "Stopped";
    static 0x01 = "Running";
    static 0x02 = "Paused";
    static 0x03 = "Error";
    static 0x40 = "SeekingCharger";
    static 0x41 = "Charging";
    static 0x42 = "Docked";
    static 0x43 = "EmptyingDustBin";
    static 0x44 = "CleaningMop";
    static 0x45 = "FillingWaterTank";
    static 0x46 = "UpdatingMaps";
}
Object.freeze(OperationalStateEnum);

class ErrorStateEnum {
    static 0x00 = "NoError";
    static 0x01 = "UnableToStartOrResume";
    static 0x02 = "UnableToCompleteOperation";
    static 0x03 = "CommandInvalidInState";
    static 0x40 = "FailedToFindChargingDock";
    static 0x41 = "Stuck";
    static 0x42 = "DustBinMissing";
    static 0x43 = "DustBinFull";
    static 0x44 = "WaterTankEmpty";
    static 0x45 = "WaterTankMissing";
    static 0x46 = "WaterTankLidOpen";
    static 0x47 = "MopCleaningPadMissing";
    static 0x48 = "LowBattery";
    static 0x49 = "CannotReachTargetArea";
    static 0x4A = "DirtyWaterTankFull";
    static 0x4B = "DirtyWaterTankMissing";
    static 0x4C = "WheelsJammed";
    static 0x4D = "BrushJammed";
    static 0x4E = "NavigationSensorObscured";
}
Object.freeze(ErrorStateEnum);

class OperationalStatusBitmap_Global {
    static 0x00 = "stopped";
    static 0x01 = "opening";
    static 0x02 = "closing";
}
Object.freeze(OperationalStatusBitmap_Global)

//

class MatterClusters {
    static OnOff               = 0x0006;
    static LevelControl        = 0x0008;
    static RvcRunMode          = 0x0054;
    static RvcOperationalState = 0x0061;
    static WindowCovering      = 0x0102;
    static ServiceArea         = 0x0150;
}
Object.freeze(MatterClusters);

// Export

module.exports = {
    OperationalStateEnum,
    ErrorStateEnum,
    OperationalStatusBitmap_Global,
    MatterClusters
};
