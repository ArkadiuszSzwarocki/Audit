// This repository is disabled - ApprovalChain model no longer exists in Prisma schema

export class ApprovalChainRepository {
  async getChainByDepartmentId(departmentId: string) {
    throw new Error('ApprovalChainRepository is disabled');
  }

  async getApprovalLevel(departmentId: string, level: number) {
    throw new Error('ApprovalChainRepository is disabled');
  }

  async create(data: any) {
    throw new Error('ApprovalChainRepository is disabled');
  }

  async update(departmentId: string, level: number, data: any) {
    throw new Error('ApprovalChainRepository is disabled');
  }

  async deleteLevel(departmentId: string, level: number) {
    throw new Error('ApprovalChainRepository is disabled');
  }

  async deleteChainByDepartment(departmentId: string) {
    throw new Error('ApprovalChainRepository is disabled');
  }
}

