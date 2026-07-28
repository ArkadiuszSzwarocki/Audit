export class OrganizationService {
  constructor() {}

  async createPosition(data: { name: string; description?: string; level: number; permissions?: string }) {
    throw new Error('OrganizationService is disabled');
  }

  async getAllPositions() {
    throw new Error('OrganizationService is disabled');
  }

  async createDepartment(data: {
    name: string;
    description?: string;
    shiftMode?: number;
    parentDepartmentId?: string;
    headId?: string;
  }) {
    throw new Error('OrganizationService is disabled');
  }

  async getOrganizationStructure() {
    throw new Error('OrganizationService is disabled');
  }

  async assignHeadToDepartment(departmentId: string, userId: string) {
    throw new Error('OrganizationService is disabled');
  }

  async assignEmployeeToDepartment(data: {
    userId: string;
    departmentId: string;
    managerId?: string;
    positionId?: string;
    shiftMode?: number;
  }) {
    throw new Error('OrganizationService is disabled');
  }

  async getEmployeeProfile(userId: string) {
    throw new Error('OrganizationService is disabled');
  }

  async getApprovalChainForEmployee(userId: string) {
    throw new Error('OrganizationService is disabled');
  }

  async setupApprovalChain(data: {
    departmentId: string;
    approvalLevels: Array<{
      level: number;
      approverPositionId: string;
      autoApprove?: boolean;
    }>;
  }) {
    throw new Error('OrganizationService is disabled');
  }

  async getApprovalChain(departmentId: string) {
    throw new Error('OrganizationService is disabled');
  }

  async getNextApprover(userId: string, departmentId: string, currentLevel: number = 0) {
    throw new Error('OrganizationService is disabled');
  }
}
