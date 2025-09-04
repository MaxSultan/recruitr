'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('seasons', 'grade', {
      type: Sequelize.STRING(10),
      allowNull: true,
      comment: 'Grade level during this season (e.g., "9th", "10th", "11th", "12th", "Fr", "So", "Jr", "Sr")'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('seasons', 'grade');
  }
};
