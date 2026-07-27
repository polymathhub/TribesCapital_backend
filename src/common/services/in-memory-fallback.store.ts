type EventRecord = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  location?: string | null;
  isVirtual?: boolean;
  eventType?: string | null;
  meetingPlatform?: string | null;
  meetingLink?: string | null;
  meetingHandle?: string | null;
  meetingInstructions?: string | null;
  startDate: Date;
  endDate: Date;
  capacity: number;
  registrationDeadline?: Date | null;
  isPublished: boolean;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  rsvps: Array<{ id: string; userId: string; eventId: string; guestCount: number; createdAt: Date; updatedAt: Date }>;
};

type DueDiligenceRecord = {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  priority: string;
  completionPercent: number;
  targetName: string;
  targetType?: string | null;
  targetMetadata?: Record<string, any> | null;
  score?: number | null;
  recommendation?: string | null;
  riskLevel?: string | null;
  startDate: Date;
  targetDeadline?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  assignedToId?: string | null;
  items: Array<Record<string, any>>;
  documents: Array<Record<string, any>>;
  comments: Array<Record<string, any>>;
  approvals: Array<Record<string, any>>;
  _count?: Record<string, number>;
};

class InMemoryFallbackStore {
  private events: EventRecord[] = [];
  private dueDiligenceCases: DueDiligenceRecord[] = [];

  createEvent(eventData: any, organizerId: string): EventRecord {
    const created: EventRecord = {
      id: `mem-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: eventData.title,
      slug: eventData.slug || 'event',
      description: eventData.description || '',
      location: eventData.location || (eventData.isVirtual ? 'Virtual' : 'TBD'),
      isVirtual: Boolean(eventData.isVirtual),
      eventType: eventData.eventType || 'Office hours',
      meetingPlatform: eventData.meetingPlatform || null,
      meetingLink: eventData.meetingLink || null,
      meetingHandle: eventData.meetingHandle || eventData.meetingLink || null,
      meetingInstructions: eventData.meetingInstructions || null,
      startDate: new Date(eventData.startDate),
      endDate: new Date(eventData.endDate),
      capacity: Number(eventData.capacity || 100),
      registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline) : null,
      isPublished: true,
      creatorId: organizerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      rsvps: [],
    };

    this.events.unshift(created);
    return created;
  }

  listEvents(skip = 0, take = 10): EventRecord[] {
    return this.events.filter((event) => event.isPublished).slice(skip, skip + take);
  }

  getEvent(id: string): EventRecord | undefined {
    return this.events.find((event) => event.id === id);
  }

  createRsvp(eventId: string, userId: string, guestCount = 1) {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const existing = event.rsvps.find((rsvp) => rsvp.userId === userId);
    if (existing) {
      throw new Error('Already RSVP\'d to this event');
    }

    const rsvp = {
      id: `mem-rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      eventId,
      guestCount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    event.rsvps.push(rsvp);
    return rsvp;
  }

  cancelRsvp(eventId: string, userId: string) {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    event.rsvps = event.rsvps.filter((rsvp) => rsvp.userId !== userId);
  }

  getRsvps(eventId: string) {
    const event = this.getEvent(eventId);
    return event?.rsvps || [];
  }

  updateEvent(id: string, updateData: any) {
    const event = this.events.find((entry) => entry.id === id);
    if (!event) {
      throw new Error('Event not found');
    }

    Object.assign(event, {
      ...updateData,
      updatedAt: new Date(),
    });
    return event;
  }

  createDueDiligence(data: any, userId: string) {
    const created: DueDiligenceRecord = {
      id: `mem-dd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: data.title,
      description: data.description || '',
      type: data.type || 'investment',
      status: 'draft',
      priority: data.priority || 'medium',
      completionPercent: 0,
      targetName: data.targetName,
      targetType: data.targetType || 'company',
      targetMetadata: data.targetMetadata || {},
      score: 0,
      recommendation: null,
      riskLevel: 'low',
      startDate: new Date(),
      targetDeadline: data.targetDeadline ? new Date(data.targetDeadline) : null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      creatorId: userId,
      assignedToId: data.assignedToId || null,
      items: [],
      documents: [],
      comments: [],
      approvals: [],
      _count: {
        items: 0,
        documents: 0,
        comments: 0,
        approvals: 0,
      },
    };

    this.dueDiligenceCases.unshift(created);
    return created;
  }

  listDueDiligence() {
    return this.dueDiligenceCases;
  }

  getDueDiligence(id: string) {
    return this.dueDiligenceCases.find((entry) => entry.id === id);
  }

  updateDueDiligence(id: string, updates: any) {
    const record = this.dueDiligenceCases.find((entry) => entry.id === id);
    if (!record) {
      throw new Error('Due diligence not found');
    }

    Object.assign(record, updates, { updatedAt: new Date() });
    return record;
  }

  createDueDiligenceItem(dueDiligenceId: string, itemData: any) {
    const record = this.getDueDiligence(dueDiligenceId);
    if (!record) {
      throw new Error('Due diligence not found');
    }

    const item = {
      id: `mem-dd-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...itemData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    record.items.push(item);
    record._count = {
      ...record._count,
      items: record.items.length,
    };
    return item;
  }

  createDueDiligenceDocument(dueDiligenceId: string, documentData: any) {
    const record = this.getDueDiligence(dueDiligenceId);
    if (!record) {
      throw new Error('Due diligence not found');
    }

    const document = {
      id: `mem-dd-doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...documentData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    record.documents.push(document);
    record._count = {
      ...record._count,
      documents: record.documents.length,
    };
    return document;
  }
}

export const inMemoryFallbackStore = new InMemoryFallbackStore();
