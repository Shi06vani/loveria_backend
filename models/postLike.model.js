export default (sequelize, DataTypes) => {
  const PostLike = sequelize.define(
    "PostLike",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      postId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "posts",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users", // Assuming Auth table is 'users' based on other files, or 'auths'?
          // Looking at post.model.js: references: { model: "users", key: "id" }
          // Looking at models/index.js db.Auth = AuthModel...
          // Let's check auth.model.js table name to be sure.
          key: "id",
        },
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "post_likes",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["post_id", "user_id"],
        },
      ],
    }
  );

  return PostLike;
};
