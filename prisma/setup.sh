#!/bin/bash
# Prisma マイグレーションとクライアント生成

# 初期マイグレーション作成
npx prisma migrate dev --name init

# Prisma クライアント生成
npx prisma generate

echo "Prisma setup completed!"