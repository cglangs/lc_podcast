/* jshint indent: 2 */

const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('intervals', {
    interval_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    seconds: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'intervals',
    schema: 'cloze_chinese',
    timestamps: false,
    indexes: [
      {
        name: "intervals_pkey",
        unique: true,
        fields: [
          { name: "interval_id" },
        ]
      },
    ]
  });
};
