/// <reference types="jest" />
import { AdminOperationsService } from './admin-operations.service';

describe('AdminOperationsService investment decisions', () => {
  const decisionDto = { decision: 'approved' as const, reason: 'Reviewed complete diligence' };

  function buildService({ actorRoles = ['investment-approver'], approvalStatus = 'pending' } = {}) {
    const tx = {
      dueDiligence: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'diligence-1',
          title: 'Solar project diligence',
          status: 'review',
          projectId: 'project-1',
          items: [{ status: 'completed' }],
          documents: [{ status: 'approved' }],
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      dueDiligenceApproval: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'approval-1',
          dueDiligenceId: 'diligence-1',
          approverId: 'approver-1',
          status: approvalStatus,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          isActive: true,
          roles: actorRoles.map((name) => ({ name })),
        }),
      },
      project: {
        findUnique: jest.fn().mockResolvedValue({ id: 'project-1', status: 'due-diligence' }),
        update: jest.fn().mockResolvedValue({}),
      },
      projectAuditLog: { create: jest.fn().mockResolvedValue({}) },
      dueDiligenceAuditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      isDatabaseAvailable: jest.fn().mockReturnValue(true),
      $transaction: jest.fn((callback) => callback(tx)),
    };
    return { service: new AdminOperationsService(prisma as never), tx };
  }

  it('requires an active investment approver even when an endpoint is called directly', async () => {
    const { service, tx } = buildService({ actorRoles: ['admin'] });

    await expect(service.decideInvestmentApproval('diligence-1', 'approval-1', 'approver-1', decisionDto))
      .rejects.toThrow('An active investment-approver role is required');

    expect(tx.dueDiligenceApproval.updateMany).not.toHaveBeenCalled();
    expect(tx.project.update).not.toHaveBeenCalled();
  });

  it('does not apply the same approval decision twice', async () => {
    const { service, tx } = buildService({ approvalStatus: 'approved' });

    await expect(service.decideInvestmentApproval('diligence-1', 'approval-1', 'approver-1', decisionDto))
      .rejects.toThrow('This approval has already been decided');

    expect(tx.dueDiligenceApproval.updateMany).not.toHaveBeenCalled();
    expect(tx.project.update).not.toHaveBeenCalled();
  });

  it('blocks final approval while checklist items or diligence documents are outstanding', async () => {
    const { service, tx } = buildService();
    tx.dueDiligence.findUnique.mockResolvedValue({
      id: 'diligence-1',
      title: 'Solar project diligence',
      status: 'review',
      projectId: 'project-1',
      items: [{ status: 'pending' }],
      documents: [{ status: 'pending_review' }],
    });

    await expect(service.decideInvestmentApproval('diligence-1', 'approval-1', 'approver-1', decisionDto))
      .rejects.toThrow('Approval is blocked: 1 checklist item(s) and 1 document(s) remain incomplete or unapproved.');

    expect(tx.dueDiligenceApproval.updateMany).not.toHaveBeenCalled();
    expect(tx.project.update).not.toHaveBeenCalled();
  });

  it('moves an approved project from due diligence to structuring', async () => {
    const { service, tx } = buildService();

    await service.decideInvestmentApproval('diligence-1', 'approval-1', 'approver-1', decisionDto);

    expect(tx.project.update).toHaveBeenCalledWith({
      where: { id: 'project-1' },
      data: { status: 'structuring' },
    });
  });
});
