// This repository is disabled - Department model no longer exists in Prisma schema

export class DepartmentRepository {
  async findAll(options?: any): Promise<any[]> {
    throw new Error('DepartmentRepository is disabled');
  }

  async findById(id: string, includeHierarchy?: boolean): Promise<any> {
    throw new Error('DepartmentRepository is disabled');
  }

  async findByName(name: string): Promise<any> {
    throw new Error('DepartmentRepository is disabled');
  }

  async create(data: any): Promise<any> {
    throw new Error('DepartmentRepository is disabled');
  }

  async update(id: string, data: any): Promise<any> {
    throw new Error('DepartmentRepository is disabled');
  }

  async delete(id: string): Promise<any> {
    throw new Error('DepartmentRepository is disabled');
  }

  async getHierarchyTree(): Promise<any[]> {
    throw new Error('DepartmentRepository is disabled');
  }

  async getByParentId(parentId: string | null): Promise<any[]> {
    throw new Error('DepartmentRepository is disabled');
  }

  async assignHead(departmentId: string, userId: string): Promise<any> {
    throw new Error('DepartmentRepository is disabled');
  }

  async getManagerByUserId(userId: string): Promise<any> {
    throw new Error('DepartmentRepository is disabled');
  }

  async getShiftModeByUserId(userId: string): Promise<number | null> {
    throw new Error('DepartmentRepository is disabled');
  }
}

