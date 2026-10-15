import { builderCategories, type HardwarePart, type PartCategory } from './hardwareCatalog';

export type CompatibilityState = 'compatible' | 'warning' | 'incomplete' | 'verify';

export type CompatibilityReport = {
  state: CompatibilityState;
  label: string;
  reasons: string[];
  selectedCount: number;
  missing: string[];
};

const selectedByCategory = (
  selected: Partial<Record<PartCategory, HardwarePart>>,
  category: PartCategory,
) => selected[category];

/**
 * Transparent checks over explicitly stored catalogue properties.
 * Unknown measurements stay unknown: the interface never turns missing data
 * into a confident compatibility claim.
 */
export function checkCompatibility(
  selected: Partial<Record<PartCategory, HardwarePart>>,
): CompatibilityReport {
  const reasons: string[] = [];
  const missing = builderCategories
    .filter((category) => !selectedByCategory(selected, category.id))
    .map((category) => category.label);
  const cpu = selected.cpu;
  const board = selected.motherboard;
  const ram = selected.ram;
  const gpu = selected.gpu;
  const pcCase = selected.case;
  const cooler = selected.cooler;
  const psu = selected.psu;
  const storage = selected.storage;
  let warning = false;
  let verificationNeeded = false;

  if (cpu && board) {
    if (cpu.socket && board.socket && cpu.socket !== board.socket) {
      warning = true;
      reasons.push(`CPU socket ${cpu.socket} does not match motherboard socket ${board.socket}.`);
    } else if (cpu.socket && board.socket) {
      reasons.push(`CPU and motherboard socket match (${cpu.socket}); confirm the exact board BIOS and CPU support list.`);
      verificationNeeded = true;
    } else {
      verificationNeeded = true;
      reasons.push('CPU socket or motherboard socket information is missing; verify the exact model support list.');
    }
    if (board.chipset) {
      reasons.push(`Board chipset is ${board.chipset}; chipset and BIOS support for the selected processor still need model-level confirmation.`);
      verificationNeeded = true;
    }
  }

  if (ram && board) {
    if (ram.ddrType && board.ddrType && ram.ddrType !== board.ddrType) {
      warning = true;
      reasons.push(`${ram.ddrType} memory does not match the motherboard's ${board.ddrType} memory slots.`);
    } else if (ram.ddrType && board.ddrType) {
      reasons.push(`${ram.ddrType} generation matches the motherboard.`);
      if (ram.capacityGb && board.capacityGb && ram.capacityGb > board.capacityGb) {
        warning = true;
        reasons.push(`Memory capacity ${ram.capacityGb} GB exceeds the board's listed ${board.capacityGb} GB maximum.`);
      }
    } else {
      verificationNeeded = true;
      reasons.push('Memory generation or board memory support is not fully recorded; check the exact board specification.');
    }
  }

  if (board && pcCase) {
    if (board.formFactor && pcCase.supportedFormFactors) {
      if (!pcCase.supportedFormFactors.includes(board.formFactor)) {
        warning = true;
        reasons.push(`${board.formFactor} motherboard is not in the case's listed supported form factors.`);
      } else {
        reasons.push(`${board.formFactor} board is listed as supported by the selected case.`);
      }
    } else {
      verificationNeeded = true;
      reasons.push('Board form factor or case support data is incomplete; confirm dimensions in the manufacturers’ manuals.');
    }
  }

  if (gpu && pcCase) {
    if (gpu.gpuLengthMm && pcCase.clearanceMm) {
      if (gpu.gpuLengthMm > pcCase.clearanceMm) {
        warning = true;
        reasons.push(`Estimated GPU length ${gpu.gpuLengthMm} mm exceeds listed case clearance ${pcCase.clearanceMm} mm.`);
      } else {
        reasons.push(`Estimated GPU length ${gpu.gpuLengthMm} mm is within listed case clearance ${pcCase.clearanceMm} mm; exact card model and radiator layout still matter.`);
        verificationNeeded = true;
      }
    } else {
      verificationNeeded = true;
      reasons.push('Clearance not verified: exact GPU board dimensions or case configuration are not certain.');
    }
  }

  if (cpu && cooler) {
    if (cpu.socket && cooler.coolerSockets) {
      if (!cooler.coolerSockets.includes(cpu.socket)) {
        warning = true;
        reasons.push(`Cooler catalogue socket list does not include ${cpu.socket}.`);
      } else {
        reasons.push(`Cooler lists ${cpu.socket} support; check that the exact package includes the required mounting kit.`);
        verificationNeeded = true;
      }
    } else {
      verificationNeeded = true;
      reasons.push('Cooler socket support is incomplete; verify the included mounting kit.');
    }
    if (pcCase && cooler.coolerHeightMm && pcCase.id === 'case-matx' && cooler.coolerHeightMm > 150) {
      warning = true;
      reasons.push(`Cooler height ${cooler.coolerHeightMm} mm is above this catalogue case's approximate 150 mm clearance; confirm the case manual.`);
    } else if (pcCase && cooler.radiatorMm) {
      verificationNeeded = true;
      reasons.push(`${cooler.radiatorMm} mm radiator placement is not checked against exact case mounting position and component clearance.`);
    } else if (pcCase && !cooler.coolerHeightMm) {
      verificationNeeded = true;
      reasons.push('Cooler height or case clearance data is not enough to confirm physical fit.');
    }
  }

  if (psu && cpu) {
    const estimatedDemand =
      (cpu.powerW ?? 100) +
      (gpu?.powerW ?? (gpu ? 200 : 0)) +
      (cooler?.powerW ?? 8) +
      (selected.fans?.powerW ?? 6) +
      (storage ? 12 : 0) +
      80;
    const recommended = Math.ceil((estimatedDemand * 1.3) / 50) * 50;
    if (psu.psuWattage && psu.psuWattage < estimatedDemand) {
      warning = true;
      reasons.push(`Estimated component demand is about ${estimatedDemand} W before workload variation; ${psu.psuWattage} W PSU is below that estimate.`);
    } else if (psu.psuWattage && psu.psuWattage < recommended) {
      warning = true;
      reasons.push(`Estimated demand is about ${estimatedDemand} W; roughly ${recommended} W with 30% headroom is a useful target, so this ${psu.psuWattage} W PSU has limited headroom.`);
    } else if (psu.psuWattage) {
      reasons.push(`Estimated demand is about ${estimatedDemand} W; ${psu.psuWattage} W provides the modelled headroom. Verify connectors, PSU dimensions and exact revisions.`);
      verificationNeeded = true;
    } else {
      verificationNeeded = true;
      reasons.push('PSU wattage is not recorded; compare a reputable system power estimate and verify connectors and dimensions.');
    }
    if (!psu.connectors?.length) {
      verificationNeeded = true;
      reasons.push('Power connectors are not fully specified. Confirm required GPU connectors and PSU cable configuration.');
    }
  }

  if (storage && board) {
    if (storage.storageInterface && board.supportedStorage) {
      if (!board.supportedStorage.includes(storage.storageInterface)) {
        warning = true;
        reasons.push(`${storage.storageInterface} is not in the selected board's listed storage support.`);
      } else {
        reasons.push(`${storage.storageInterface} appears in the selected board's supported storage interfaces; check slot sharing and exact model details.`);
        verificationNeeded = true;
      }
    } else {
      verificationNeeded = true;
      reasons.push('Storage interface or motherboard slot data is incomplete; confirm the board manual, including M.2 slot mode.');
    }
  }

  if (missing.length > 0) {
    reasons.unshift(`Build is incomplete: ${missing.join(', ')} not selected.`);
  }

  let state: CompatibilityState = 'compatible';
  if (warning) {
    state = 'warning';
  } else if (missing.length > 0) {
    state = 'incomplete';
  } else if (verificationNeeded) {
    state = 'verify';
  }

  const labels: Record<CompatibilityState, string> = {
    compatible: 'Compatible checks passed',
    warning: 'Potential compatibility warning',
    incomplete: 'Incomplete build',
    verify: 'Needs verification',
  };

  return {
    state,
    label: labels[state],
    reasons: reasons.length ? reasons : ['No part-to-part rules were triggered; verify exact model specifications before purchasing.'],
    selectedCount: builderCategories.length - missing.length,
    missing,
  };
}
