/* jshint indent: 2 */

const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('users', {
    user_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    userpassword: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    userrole: {
      type: DataTypes.ENUM("ADMIN","STUDENT","TESTER"),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'users',
    schema: 'cloze_chinese',
    timestamps: false,
    indexes: [
      {
        name: "users_pkey",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
