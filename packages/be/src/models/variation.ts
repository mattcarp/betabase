import { DataTypes } from 'sequelize';

import db from './index';

export const Variation = db.sequelize.define('Variation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  scenarioId: {
    type: DataTypes.NUMBER,
    field: 'scenario_id',
  },
  variationText: {
    type: DataTypes.TEXT,
    nullable: true,
    field: 'variation_text',
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
  },
  createdBy: {
    type: DataTypes.STRING,
    length: 127,
    field: 'created_by',
  },
  updatedBy: {
    type: DataTypes.STRING,
    length: 127,
    nullable: true,
    field: 'updated_by',
  },
}, {
  freezeTableName: true,
  tableName: 'variation',
});

export const addVariation = async (params) => {
  const model = await Variation.create(params);
  await model.save();
  return model;
}

export const updateVariation = async (id, params) => {
  await Variation.update({ ...params }, { where: { id }});
  return id;
}

export const getScenarioVariations = async (scenarioId: string) => {
  const result = await Variation.findAll({
    where: { scenarioId },
  });
  return result || [];
}

db.Variation = Variation;
