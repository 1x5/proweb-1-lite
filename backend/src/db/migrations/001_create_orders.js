const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Orders', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      profit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      profitPercent: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      prepayment: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Ожидает'
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      messenger: {
        type: DataTypes.STRING,
        allowNull: true
      },
      expenses: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      photos: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Orders');
  }
}; 