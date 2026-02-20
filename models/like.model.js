export default (sequelize, DataTypes) => {
  const Like = sequelize.define(
    "Like",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      receiverId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      status: {
        type: DataTypes.ENUM("pending", "matched", "rejected"),
        defaultValue: "pending",
      },
    },
    {
      tableName: "likes",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["sender_id", "receiver_id"],
        },
      ],
    }
  );

  return Like;
};
