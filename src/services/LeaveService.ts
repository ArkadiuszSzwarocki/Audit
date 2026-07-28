export class LeaveService {
  constructor() {
    // LeaveService is disabled - do not initialize repositories
  }

  private async countWorkDays(userId: string, startDate: Date, endDate: Date): Promise<number> {
    throw new Error('LeaveService is disabled');
  }

  async createLeaveRequest(data: {
    userId: string;
    startDate: Date;
    endDate: Date;
    type: string;
    reason?: string;
    managerId?: string;
  }): Promise<any> {
    throw new Error('LeaveService is disabled');
  }

  async approveLeaveRequest(id: string): Promise<any> {
    throw new Error('LeaveService is disabled');
  }

  async rejectLeaveRequest(id: string, reason?: string): Promise<any> {
    throw new Error('LeaveService is disabled');
  }

  async generateMonthlySchedule(userId: string, year: number, month: number): Promise<any> {
    throw new Error('LeaveService is disabled');
  }

  async assignShift(userId: string, workDate: Date, shiftType: string): Promise<any> {
    throw new Error('LeaveService is disabled');
  }

  async getSchedule(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    throw new Error('LeaveService is disabled');
  }

  async getNextApprover(departmentId: string, currentLevel: number): Promise<any> {
    throw new Error('LeaveService is disabled');
  }

  async createNextApprovalRequest(
    originalRequest: any,
    nextApproverId: string,
    approvalLevel: number
  ): Promise<any> {
    throw new Error('LeaveService is disabled');
  }
}
