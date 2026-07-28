// This repository is disabled - Position model no longer exists in Prisma schema

export class PositionRepository {
  async findAll() {
    throw new Error('PositionRepository is disabled');
  }

  async findById(id: string) {
    throw new Error('PositionRepository is disabled');
  }

  async findByName(name: string) {
    throw new Error('PositionRepository is disabled');
  }

  async create(data: any) {
    throw new Error('PositionRepository is disabled');
  }

  async update(id: string, data: any) {
    throw new Error('PositionRepository is disabled');
  }

  async delete(id: string) {
    throw new Error('PositionRepository is disabled');
  }
}

