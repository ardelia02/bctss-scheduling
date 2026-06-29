/* ================================================================
   1. SEED DATA – Pre-populated resources and sample schedule
   ================================================================ */
const SEED_DATA = {

  admins: [
    { id: 'adrea', name: 'Adrea', password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' },
    { id: 'puteri', name: 'Puteri', password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' },
  ],

  classrooms: [
    { id: 'cr1', name: 'Room A',          capacity: 30, type: 'Training Room' },
    { id: 'cr2', name: 'Room B',          capacity: 20, type: 'Training Room' },
    { id: 'cr3', name: 'Computer Lab 1',  capacity: 25, type: 'Computer Lab' },
    { id: 'cr4', name: 'Computer Lab 2',  capacity: 25, type: 'Computer Lab' },
  ],

  trainers: [
    { id: 'tr1', name: 'John Tan',    initials: 'JT', password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', level: 'Trainer', type: 'Full Time' },
    { id: 'tr2', name: 'Sarah Lim',   initials: 'SL', password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', level: 'Specialist Trainer', type: 'Full Time' },
    { id: 'tr3', name: 'Michael Lee', initials: 'ML', password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', level: 'Principal Trainer', type: 'Full Time' },
    { id: 'tr4', name: 'David Ong',   initials: 'DO', password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', level: 'Master Trainer', type: 'Adjunct' },
    { id: 'tr5', name: 'Cheryl Ng',   initials: 'CN', password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', level: 'Trainer', type: 'Adjunct' },
  ],

  topics: [
    { id: 'top1', name: 'General' },
    { id: 'top2', name: 'Advanced Skills' }
  ],

  lessons: [
    { id: 'ls1', topicId: 'top1', name: 'Leadership Fundamentals',       durationHours: 16, prerequisiteIds: [] },
    { id: 'ls2', topicId: 'top1', name: 'Team Dynamics',                 durationHours: 8, prerequisiteIds: []  },
    { id: 'ls3', topicId: 'top1', name: 'Communication Skills',          durationHours: 8, prerequisiteIds: []  },
    { id: 'ls4', topicId: 'top1', name: 'Workplace Safety',              durationHours: 4, prerequisiteIds: []  },
    { id: 'ls5', topicId: 'top2', name: 'Customer Service Excellence',   durationHours: 12, prerequisiteIds: [] },
    { id: 'ls6', topicId: 'top2', name: 'Project Management',            durationHours: 16, prerequisiteIds: [] },
  ],

  /**
   * Trainer Authorisation Matrix
   * Maps lessonId → array of authorised trainerIds
   */
  authMatrix: {
    ls1: ['tr1', 'tr2'],
    ls2: ['tr1', 'tr3'],
    ls3: ['tr2', 'tr5'],
    ls4: ['tr4'],
    ls5: ['tr5', 'tr2'],
    ls6: ['tr3'],
  },

  /** Pre-populated batches */
  batches: [
    {
      id: 'b1',
      name: 'Batch 2026-01',
      startDate: '2026-06-01',
      endDate:   '2026-11-30',
      students:  28,
      status:    'active',
      mentorIds: ['tr1', 'tr2'],
      colorIndex: 0,
    },
    {
      id: 'b2',
      name: 'Batch 2026-02',
      startDate: '2026-07-01',
      endDate:   '2026-12-31',
      students:  22,
      status:    'active',
      mentorIds: ['tr3'],
      colorIndex: 1,
    },
  ],

  /** Pre-populated scheduled events */
  events: [
    {
      id: 'ev1',
      batchIds:    ['b1'],
      lessonId:    'ls1',
      date:        '2026-06-10',
      startTime:   '09:00',
      endTime:     '12:00',
      classroomIds: ['cr1'],
      trainerIds:  ['tr1'],
      status:      'scheduled',
    },
    {
      id: 'ev2',
      batchIds:    ['b1'],
      lessonId:    'ls4',
      date:        '2026-06-10',
      startTime:   '13:00',
      endTime:     '17:00',
      classroomIds: ['cr2'],
      trainerIds:  ['tr4'],
      status:      'scheduled',
    },
    {
      id: 'ev3',
      batchIds:    ['b1'],
      lessonId:    'ls3',
      date:        '2026-06-11',
      startTime:   '09:00',
      endTime:     '12:00',
      classroomIds: ['cr1'],
      trainerIds:  ['tr2'],
      status:      'scheduled',
    },
    {
      id: 'ev4',
      batchIds:    ['b2'],
      lessonId:    'ls2',
      date:        '2026-06-12',
      startTime:   '14:00',
      endTime:     '17:00',
      classroomIds: ['cr3'],
      trainerIds:  ['tr1', 'tr3'],
      status:      'scheduled',
    },
    {
      id: 'ev5',
      batchIds:    ['b1'],
      lessonId:    'ls5',
      date:        '2026-06-15',
      startTime:   '09:00',
      endTime:     '12:00',
      classroomIds: ['cr2'],
      trainerIds:  ['tr5'],
      status:      'scheduled',
    },
    {
      id: 'ev6',
      batchIds:    ['b2'],
      lessonId:    'ls6',
      date:        '2026-06-17',
      startTime:   '13:00',
      endTime:     '17:00',
      classroomIds: ['cr4'],
      trainerIds:  ['tr3'],
      status:      'scheduled',
    },
    {
      id: 'ev7',
      batchIds:    ['b1'],
      lessonId:    'ls1',
      date:        '2026-06-20',
      startTime:   '09:00',
      endTime:     '12:00',
      classroomIds: ['cr1'],
      trainerIds:  ['tr2'],
      status:      'scheduled',
    },
    {
      id: 'ev8',
      batchIds:    ['b2'],
      lessonId:    'ls3',
      date:        '2026-06-23',
      startTime:   '09:00',
      endTime:     '11:00',
      classroomIds: ['cr2'],
      trainerIds:  ['tr5'],
      status:      'scheduled',
    },
  ],
};

window.SEED_DATA = SEED_DATA;
