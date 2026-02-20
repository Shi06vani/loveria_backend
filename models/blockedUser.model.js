export default (sequelize, DataTypes) => {
  const BlockedUser = sequelize.define(
    "BlockedUser",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      blockerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      blockedId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "blocked_users",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["blocker_id", "blocked_id"],
        },
      ],
    }
  );

  return BlockedUser;
};
