/**
 * Pure utility functions for Quotation calculations.
 * Decoupled from React state for testability and clarity.
 */

/**
 * Calculates the totals for a quotation.
 * @param {Object} formData - The current state of the quotation form.
 * @returns {Object} Calculated totals.
 */
export const calculateQuotationTotals = (formData) => {
  let materialUnit = 0;
  let laborUnit = 0;
  let bopUnit = 0;
  let treatmentUnit = 0;

  const projectQty = Number(formData.quantity || 1);
  
  // Project-wide extras
  const totalEngineeringProject = Number(formData.design_cost || 0) + Number(formData.assembly_cost || 0); 
  const totalLogisticsProject = Number(formData.packaging_cost || 0) + Number(formData.transportation_cost || 0);

  formData.items.forEach(item => {
    const partQtyPerModel = parseFloat(item.qty || 1);
    
    // 1. Material Unit Cost
    if (item.material && item.material_weight > 0) {
        materialUnit += (item.material_weight * (item.material.base_rate || 0)) * partQtyPerModel;
    }

    // 2. Labor Unit Cost
    laborUnit += (item.processes || []).reduce((acc, p) => {
        const rate = parseFloat(p.rate || p.hourly_rate || 0);
        const unit = p.unit || 'hr';
        if (unit === 'hr') {
          const totalMinutesForUnit = (parseFloat(p.setup_time || 0) / projectQty) + (parseFloat(p.cycle_time || 0) * partQtyPerModel);
          return acc + (rate * (totalMinutesForUnit / 60));
        }
        return acc + (partQtyPerModel * parseFloat(p.cycle_time || 0) * rate);
    }, 0);

    // 3. Treatments Unit Cost
    treatmentUnit += (item.treatments || []).reduce((acc, t) => 
      acc + (parseFloat(t.cost || 0) * (t.per_unit !== false ? partQtyPerModel : (1/projectQty))), 0);
  });

  // 4. BOP Unit Cost
  bopUnit = (formData.bought_out_items || []).reduce((acc, b) => 
    acc + (parseFloat(b.rate || 0) * (b.qty || 1)), 0);

  const unitSubtotal = Number(materialUnit) + Number(laborUnit) + Number(bopUnit) + Number(treatmentUnit);
  const markupMultiplier = 1 + (Number(formData.markup || 0) / 100);
  const unitFinal = Math.round((unitSubtotal * markupMultiplier) * 100) / 100;
  
  const totalExtras = Number(totalEngineeringProject) + Number(totalLogisticsProject);
  const grandTotal = Number((unitFinal * projectQty) + totalExtras);
  
  return { 
    unitSubtotal,
    unitFinal,
    grandTotal,
    materialCost: materialUnit, 
    laborCost: laborUnit, 
    bopCost: bopUnit, 
    treatmentCost: treatmentUnit, 
    engineeringCost: totalEngineeringProject, 
    commercialCost: totalLogisticsProject,
    totalExtras
  };
};
