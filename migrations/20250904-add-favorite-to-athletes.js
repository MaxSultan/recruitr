'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('athletes', 'isFavorite', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this athlete is marked as a favorite'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('athletes', 'isFavorite');
  }
};
