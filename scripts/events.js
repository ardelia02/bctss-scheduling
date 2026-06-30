/* ================================================================
   21. EVENT LISTENERS – Wire everything together
   ================================================================ */
const initEventListeners = () => {

  // Sidebar navigation
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const view = el.dataset.view;
      if (view === 'classrooms') {
        AppState.classroomsAnchor = new Date(); // Reset to current week
        if (AppState.activeView === 'classrooms') {
          renderClassrooms(); // re-render if already there
        }
      }
      switchView(view);
    });
  });

  // Sidebar collapse toggle
  const sidebar = document.getElementById('sidebar');
  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('mobile-open');
    } else {
      sidebar.classList.toggle('collapsed');
      document.body.classList.toggle('sidebar-collapsed');
    }
  };
  document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
  document.getElementById('topbarMenuBtn').addEventListener('click', toggleSidebar);

  // Quick schedule button (topbar)
  document.getElementById('quickScheduleBtn').addEventListener('click', () => {
    switchView('schedule');
  });

  // Calendar navigation
  document.getElementById('calPrevBtn').addEventListener('click', () => navigateCalendar(-1));
  document.getElementById('calNextBtn').addEventListener('click', () => navigateCalendar(+1));
  document.getElementById('calTodayBtn').addEventListener('click', () => {
    AppState.calendarDate = new Date();
    renderCalendar();
  });

  // Calendar view toggle (month/week/day)
  document.getElementById('calMonthBtn').addEventListener('click', () => {
    AppState.calendarView = 'month';
    document.getElementById('calMonthBtn').classList.add('active');
    document.getElementById('calWeekBtn').classList.remove('active');
    document.getElementById('calDayBtn').classList.remove('active');
    renderCalendar();
  });
  document.getElementById('calWeekBtn').addEventListener('click', () => {
    AppState.calendarView = 'week';
    document.getElementById('calWeekBtn').classList.add('active');
    document.getElementById('calMonthBtn').classList.remove('active');
    document.getElementById('calDayBtn').classList.remove('active');
    renderCalendar();
  });
  document.getElementById('calDayBtn').addEventListener('click', () => {
    AppState.calendarView = 'day';
    document.getElementById('calDayBtn').classList.add('active');
    document.getElementById('calMonthBtn').classList.remove('active');
    document.getElementById('calWeekBtn').classList.remove('active');
    renderCalendar();
  });

  // Batch filter – calendar view
  document.getElementById('calBatchFilter').addEventListener('change', (e) => {
    if (isUpdatingFilter) return;  // ignore programmatic updates
    AppState.selectedBatch = e.target.value;
    renderCalendar();
  });

  // Batch schedule panel – "View" buttons (event delegation)
  document.getElementById('batchSchedulePanel').addEventListener('click', (e) => {
    const btn = e.target.closest('.view-ev-btn');
    if (btn) showEventDetail(btn.dataset.evid);
  });

  // Click on calendar events (event delegation)
  document.getElementById('calGrid').addEventListener('click', (e) => {
    const evEl = e.target.closest('[data-evid]');
    if (evEl) {
      e.stopPropagation();
      showEventDetail(evEl.dataset.evid);
    }
    // Click on empty day
    const dayCell = e.target.closest('.cal-day');
    if (dayCell && !evEl) {
      const date = dayCell.dataset.date;
      AppState.calendarDate = safeDate(date);
      AppState.calendarView = 'day';
      document.getElementById('calDayBtn').classList.add('active');
      document.getElementById('calMonthBtn').classList.remove('active');
      document.getElementById('calWeekBtn').classList.remove('active');
      renderCalendar();
    }
  });

  // Week view click
  document.getElementById('calendarWeekContainer').addEventListener('click', (e) => {
    const evEl = e.target.closest('[data-evid]');
    if (evEl) {
      showEventDetail(evEl.dataset.evid);
      return;
    }
    const cell = e.target.closest('.week-cell');
    if (cell) {
      const date = cell.dataset.date;
      const hour = cell.dataset.hour;
      switchView('schedule');
      setTimeout(() => {
        const formDate = document.getElementById('formDate');
        if (formDate) {
          formDate.value = date;
          document.getElementById('formStartTime').value = `${String(hour).padStart(2,'0')}:00`;
          document.getElementById('formEndTime').value = `${String(parseInt(hour)+3).padStart(2,'0')}:00`;
        }
      }, 50);
    }
  });

  // Dashboard event click
  document.getElementById('todaySchedule').addEventListener('click', (e) => {
    const row = e.target.closest('[data-evid]');
    if (row) showEventDetail(row.dataset.evid);
  });
  document.getElementById('upcomingLessons').addEventListener('click', (e) => {
    const row = e.target.closest('[data-evid]');
    if (row) showEventDetail(row.dataset.evid);
  });

  // Schedule form – topic/lesson/batch change
  ['formTopic', 'formLesson'].forEach(id => {
    document.getElementById(id).addEventListener('change', (e) => {
      if (id === 'formTopic') {
        const topicId = e.target.value;
        const lessonSel = document.getElementById('formLesson');
        if (!topicId) {
          lessonSel.innerHTML = '<option value="">— Select Module —</option>';
        } else {
          lessonSel.innerHTML = '<option value="">— Select Module —</option>' + 
            AppState.lessons.filter(l => l.topicId === topicId).map(l => `<option value="${l.id}">${l.name}</option>`).join('');
        }
        buildTrainerDropdown(''); // Clear trainers
      }
      if (id === 'formLesson') buildTrainerDropdown(e.target.value);
      updateFormAssistant();
    });
  });

  // Schedule form – date/time change
  ['formDate','formStartTime','formEndTime'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      updateFormAssistant();
      const lessonId = document.getElementById('formLesson').value;
      if (lessonId) {
        const preSelected = getSelectedTrainerIds();
        buildTrainerDropdown(lessonId, preSelected);
      }
    });
  });



  // Check availability button
  document.getElementById('checkAvailBtn').addEventListener('click', checkAvailability);

  // Classroom Search
  document.getElementById('classroomSearchBtn').addEventListener('click', () => {
    if (document.getElementById('classroomSearchDate').value) {
      renderClassrooms();
    }
  });
  document.getElementById('classroomSearchClearBtn').addEventListener('click', () => {
    document.getElementById('classroomSearchDate').value = '';
    renderClassrooms();
  });

  // Schedule form submit
  document.getElementById('scheduleForm').addEventListener('submit', saveSchedule);

  // Batch status filter
  document.getElementById('batchStatusFilter').addEventListener('change', (e) => {
    AppState.batchStatusFilter = e.target.value;
    renderBatches();
  });

  // Edit Batch button delegation
  document.getElementById('batchesGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('.edit-batch-btn');
    if (btn) {
      const b = getBatch(btn.dataset.bid);
      if (b) {
        document.getElementById('batchId').value = b.id;
        document.getElementById('batchName').value = b.name;
        document.getElementById('batchStart').value = b.startDate;
        document.getElementById('batchEnd').value = b.endDate;
        document.getElementById('batchStudents').value = b.students;
        document.getElementById('batchStatus').value = b.status || 'active';
        const selectedCol = b.colorHex || EVENT_COLORS[b.colorIndex % EVENT_COLORS.length] || '#3b82f6';
        document.getElementById('batchColor').value = selectedCol;
        document.getElementById('batchModalTitle').textContent = 'Edit Batch';
        buildBatchMentorDropdown(b.mentorIds || []);
        buildHomeroomDropdown(b.homeroom || '');
        renderBatchColorGrid(selectedCol);
        openModal('batchModal');
      }
    }
  });

  // New Batch button
  document.getElementById('newBatchBtn').addEventListener('click', () => {
    document.getElementById('batchForm').reset();
    document.getElementById('batchId').value = '';
    document.getElementById('batchStatus').value = 'active';
    const newCol = EVENT_COLORS[nextColor() % EVENT_COLORS.length];
    document.getElementById('batchColor').value = newCol;
    document.getElementById('batchModalTitle').textContent = 'Create New Batch';
    buildBatchMentorDropdown([]);
    buildHomeroomDropdown('');
    renderBatchColorGrid(newCol);
    openModal('batchModal');
  });

  // Lessons Grid (Edit Lesson)
  const lessonsGrid = document.getElementById('lessonsGrid');
  if (lessonsGrid) {
    lessonsGrid.addEventListener('click', (e) => {
      const editTopicBtn = e.target.closest('.edit-topic-btn');
      if (editTopicBtn) {
        const topic = AppState.topics.find(t => t.id === editTopicBtn.dataset.tid);
        if (topic) {
          document.getElementById('topicId').value = topic.id;
          document.getElementById('topicName').value = topic.name;
          document.getElementById('topicModalTitle').textContent = 'Edit Topic';
          openModal('topicModal');
        }
        return;
      }

      const btn = e.target.closest('.edit-lesson-btn');
      if (btn) {
        const lesson = getLesson(btn.dataset.id);
        if (lesson) {
          document.getElementById('lessonId').value = lesson.id;
          document.getElementById('lessonName').value = lesson.name;
          const durMins = lesson.durationHours !== undefined ? lesson.durationHours * 60 : (lesson.durationMins || 180);
          document.getElementById('lessonDuration').value = durMins / 60;
          document.getElementById('lessonRemarks').value = lesson.remarks || '';
          
          const topicSelect = document.getElementById('lessonTopic');
          topicSelect.innerHTML = AppState.topics.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('');
          topicSelect.value = lesson.topicId || AppState.topics[0].id;
          
          document.getElementById('lessonModalTitle').textContent = 'Edit Module';
          buildLessonPrerequisiteDropdown(lesson.id, lesson.prerequisiteIds || []);
          buildLessonTrainerDropdown(AppState.authMatrix[lesson.id] || []);
          openModal('lessonModal');
        }
      }
    });
  }

  // New Classroom button
  const newClassroomBtn = document.getElementById('newClassroomBtn');
  if (newClassroomBtn) {
    newClassroomBtn.addEventListener('click', () => {
      document.getElementById('classroomForm').reset();
      document.getElementById('classroomId').value = '';
      document.getElementById('classroomAddModalTitle').textContent = 'Add New Classroom';
      openModal('classroomAddModal');
    });
  }

  // Classroom Form
  const classroomForm = document.getElementById('classroomForm');
  if (classroomForm) {
    classroomForm.addEventListener('submit', saveClassroom);
  }

  const cancelClassroomBtn = document.getElementById('cancelClassroomBtn');
  if (cancelClassroomBtn) cancelClassroomBtn.addEventListener('click', () => closeModal('classroomAddModal'));
  const closeClassroomAddModal = document.getElementById('closeClassroomAddModal');
  if (closeClassroomAddModal) closeClassroomAddModal.addEventListener('click', () => closeModal('classroomAddModal'));

  // New Topic button
  const newTopicBtn = document.getElementById('newTopicBtn');
  if (newTopicBtn) {
    newTopicBtn.addEventListener('click', () => {
      document.getElementById('topicForm').reset();
      document.getElementById('topicId').value = '';
      document.getElementById('topicModalTitle').textContent = 'Add New Topic';
      openModal('topicModal');
    });
  }
  
  const topicForm = document.getElementById('topicForm');
  if (topicForm) topicForm.addEventListener('submit', saveTopic);
  
  const cancelTopicBtn = document.getElementById('cancelTopicBtn');
  if (cancelTopicBtn) cancelTopicBtn.addEventListener('click', () => closeModal('topicModal'));
  const closeTopicModal = document.getElementById('closeTopicModal');
  if (closeTopicModal) closeTopicModal.addEventListener('click', () => closeModal('topicModal'));

  // New Module button
  const newLessonBtn = document.getElementById('newLessonBtn');
  if (newLessonBtn) {
    newLessonBtn.addEventListener('click', () => {
      if (!AppState.topics || AppState.topics.length === 0) {
        showToast('Please create a Topic first!', 'warning');
        return;
      }
      document.getElementById('lessonForm').reset();
      document.getElementById('lessonId').value = '';
      
      const topicSelect = document.getElementById('lessonTopic');
      topicSelect.innerHTML = AppState.topics.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('');
      topicSelect.value = AppState.topics[0].id;
      
      document.getElementById('lessonModalTitle').textContent = 'Create New Module';
      buildLessonPrerequisiteDropdown(null, []);
      buildLessonTrainerDropdown([]);
      openModal('lessonModal');
    });
  }

  // Lesson Form
  const lessonForm = document.getElementById('lessonForm');
  if (lessonForm) {
    lessonForm.addEventListener('submit', saveLesson);
  }

  const cancelLessonBtn = document.getElementById('cancelLessonBtn');
  if (cancelLessonBtn) cancelLessonBtn.addEventListener('click', () => closeModal('lessonModal'));
  
  const closeLessonModal = document.getElementById('closeLessonModal');
  if (closeLessonModal) closeLessonModal.addEventListener('click', () => closeModal('lessonModal'));
  
  // Custom Dropdown triggers for Lesson Modal
  const lessonTrainerTrigger = document.getElementById('lessonTrainerTrigger');
  if (lessonTrainerTrigger) lessonTrainerTrigger.addEventListener('click', () => {
    document.getElementById('lessonTrainerSelect').classList.toggle('open');
  });
  const lessonPrerequisiteTrigger = document.getElementById('lessonPrerequisiteTrigger');
  if (lessonPrerequisiteTrigger) lessonPrerequisiteTrigger.addEventListener('click', () => {
    document.getElementById('lessonPrerequisiteSelect').classList.toggle('open');
  });

  // Batch form submit
  document.getElementById('batchForm').addEventListener('submit', saveBatch);

  // Admin buttons and form
  document.getElementById('newAdminBtn').addEventListener('click', () => {
    document.getElementById('adminForm').reset();
    document.getElementById('adminId').value = '';
    document.getElementById('adminPassword').placeholder = 'Required';
    document.getElementById('adminModalTitle').textContent = 'Add New Admin';
    openModal('adminModal');
  });
  document.getElementById('adminForm').addEventListener('submit', saveAdmin);
  document.getElementById('cancelAdminBtn').addEventListener('click', () => closeModal('adminModal'));
  document.getElementById('closeAdminModal').addEventListener('click', () => closeModal('adminModal'));

  // Trainer Analytics Modal
  const cancelTrainerAnalyticsBtn = document.getElementById('cancelTrainerAnalyticsBtn');
  if (cancelTrainerAnalyticsBtn) cancelTrainerAnalyticsBtn.addEventListener('click', () => closeModal('trainerAnalyticsModal'));
  const closeTrainerAnalyticsModal = document.getElementById('closeTrainerAnalyticsModal');
  if (closeTrainerAnalyticsModal) closeTrainerAnalyticsModal.addEventListener('click', () => closeModal('trainerAnalyticsModal'));

  document.getElementById('adminsGrid').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-admin-btn');
    if (editBtn) {
      const a = AppState.admins.find(adm => adm.id === editBtn.dataset.aid);
      if (a) {
        document.getElementById('adminId').value = a.id;
        document.getElementById('adminName').value = a.name;
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').placeholder = 'Leave blank to keep unchanged';
        document.getElementById('adminModalTitle').textContent = 'Edit Admin';
        openModal('adminModal');
      }
    }
  });

  // New Trainer button
  document.getElementById('newTrainerBtn').addEventListener('click', () => {
    document.getElementById('trainerForm').reset();
    document.getElementById('trainerId').value = '';
    document.getElementById('trainerType').value = 'Full Time';
    document.getElementById('trainerModalTitle').textContent = 'Add New Trainer';
    document.getElementById('trainerRecordsSection').style.display = 'none';
    buildTrainerCoursesDropdown([]);
    openModal('trainerModal');
  });

  // Edit Trainer button delegation
  let currentImportTrainerId = null;
  document.getElementById('trainersGrid').addEventListener('click', (e) => {
    const importBtn = e.target.closest('.import-trainer-btn');
    if (importBtn) {
      currentImportTrainerId = importBtn.dataset.tid;
      openModal('importScheduleModal');
      return;
    }
  });
window.editTrainer = (trainerId, monthHrs, todayHtml, uData) => {
  const t = getTrainer(trainerId);
  if (!t) return;
  
  document.getElementById('trainerId').value = t.id;
  document.getElementById('trainerName').value = t.name;
  document.getElementById('trainerInitials').value = t.initials;
  document.getElementById('trainerType').value = t.type || 'Full Time';
  document.getElementById('trainerModalTitle').textContent = 'Trainer Details & Edit';
  
  const statsDiv = document.getElementById('trainerModalStats');
  if (statsDiv) {
    statsDiv.style.display = 'block';
    document.getElementById('trainerModalHrs').innerHTML = `⏳ ${monthHrs} teaching hours this month`;
    document.getElementById('trainerModalToday').innerHTML = todayHtml;
    
    let uHtml = '';
    try {
      const uArr = JSON.parse(decodeURIComponent(uData));
      if (uArr && uArr.length > 0) {
        uHtml = `<div style="font-size:12px; font-weight:600; margin-bottom:4px; color:var(--gray-600); margin-top:8px; border-top:1px solid var(--border); padding-top:8px;">Upcoming Leave/Unavailability:</div>` +
          uArr.map(u => `<div style="margin-bottom:2px; font-size:11px; color:var(--gray-500);">🚫 ${fmtDate(u.date)} ${fmtTime(u.startTime)}–${fmtTime(u.endTime)} — ${escapeHTML(u.reason)}</div>`).join('');
      }
    } catch(e) {}
    document.getElementById('trainerModalUnavail').innerHTML = uHtml;
  }
  
  // Find courses this trainer is authorised for
  const authCourses = Object.entries(AppState.authMatrix)
    .filter(([, tids]) => tids.includes(t.id))
    .map(([lid]) => lid);
    
  buildTrainerCoursesDropdown(authCourses);

  // Populate past records (monthly teaching hours)
        const pastEvs = AppState.events.filter(e => (e.trainerIds || []).includes(t.id) && e.status !== 'cancelled' && safeDate(e.date || 0) < new Date());
        
        const monthlyHours = {};
        pastEvs.forEach(e => {
          const d = safeDate(e.date || 0);
          const monthKey = d.toLocaleString('default', { month: 'short', year: 'numeric' });
          const hrs = (timeToMin(e.endTime) - timeToMin(e.startTime)) / 60;
          monthlyHours[monthKey] = (monthlyHours[monthKey] || 0) + hrs;
        });
        
        const listDiv = document.getElementById('trainerRecordsList');
        const months = Object.keys(monthlyHours);
        if (months.length > 0) {
          listDiv.innerHTML = months.map(m => `
            <div style="padding: 8px; background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 4px; display: flex; justify-content: space-between;">
              <div style="font-weight: 500; color: var(--gray-900);">${m}</div>
              <div style="color: var(--brand-600); font-weight: 500;">${Math.round(monthlyHours[m] * 10) / 10} hours</div>
            </div>
          `).join('');
        } else {
          listDiv.innerHTML = '<div>No past records found.</div>';
        }
        document.getElementById('trainerRecordsSection').style.display = 'block';

        openModal('trainerModal');
};

window.showTrainerLeaveRequests = (trainerId, uData) => {
  const t = getTrainer(trainerId);
  if (!t) return;
  document.getElementById('trainerLeaveModalTitle').textContent = `${escapeHTML(t.name)}'s Leave Requests`;
  
  let uHtml = '<div style="padding:16px; color:var(--gray-500); font-size:13px;">No upcoming leaves.</div>';
  try {
    const uArr = JSON.parse(decodeURIComponent(uData));
    if (uArr && uArr.length > 0) {
      uHtml = '<div style="padding:16px; display:flex; flex-direction:column; gap:12px;">' + uArr.map(u => `
        <div style="background:var(--gray-50); border:1px solid var(--border); border-radius:8px; padding:12px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <div style="font-weight:600; color:var(--gray-900);">${(u.type || 'busy').toUpperCase()}</div>
            <div style="font-size:12px; color:var(--gray-500);">${u.reason || 'No reason'}</div>
          </div>
          <div style="font-size:13px; color:var(--gray-700);">📅 ${fmtDate(u.date)}</div>
          <div style="font-size:13px; color:var(--gray-700);">⏰ ${fmtTime(u.startTime)} – ${fmtTime(u.endTime)}</div>
        </div>
      `).join('') + '</div>';
    }
  } catch(e) {}
  document.getElementById('trainerLeaveModalBody').innerHTML = uHtml;
  openModal('trainerLeaveModal');
};

  // Trainer form submit
  document.getElementById('trainerForm').addEventListener('submit', saveTrainer);

  // Close modals
  document.getElementById('closeTrainerModal').addEventListener('click', () => closeModal('trainerModal'));
  document.getElementById('cancelTrainerBtn').addEventListener('click', () => closeModal('trainerModal'));
  document.getElementById('closeBatchModal').addEventListener('click', () => closeModal('batchModal'));
  document.getElementById('cancelBatchBtn').addEventListener('click', () => closeModal('batchModal'));
  document.getElementById('closeEventModal').addEventListener('click', () => closeModal('eventDetailModal'));
  document.getElementById('closeEventModalBtn').addEventListener('click', () => closeModal('eventDetailModal'));
  document.getElementById('closeConflictModal').addEventListener('click', () => closeModal('conflictModal'));
  document.getElementById('closeConflictModalBtn').addEventListener('click', () => closeModal('conflictModal'));
  document.getElementById('closeDragModal').addEventListener('click', () => closeModal('dragConfirmModal'));
  document.getElementById('cancelDragBtn').addEventListener('click', () => closeModal('dragConfirmModal'));
  document.getElementById('confirmDragBtn').addEventListener('click', confirmDrop);
  document.getElementById('closeClassroomModal').addEventListener('click', () => closeModal('classroomScheduleModal'));

  // Classroom click delegation
  document.getElementById('classroomsGrid').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-classroom-btn');
    if (editBtn) {
      e.stopPropagation();
      const c = AppState.classrooms.find(cr => cr.id === editBtn.dataset.crid);
      if (c) {
        document.getElementById('classroomId').value = c.id;
        document.getElementById('classroomName').value = c.name;
        document.getElementById('classroomType').value = c.type || '';
        document.getElementById('classroomPax').value = c.pax || c.capacity || '';
        document.getElementById('classroomAddModalTitle').textContent = 'Edit Classroom';
        openModal('classroomAddModal');
      }
      return;
    }
    const card = e.target.closest('.classroom-card');
    if (card) showClassroomSchedule(card.dataset.crid);
  });



  // Splash Screen - Admin Login
  document.getElementById('splashAdminLoginBtn').addEventListener('click', () => {
    const adminId = document.getElementById('splashAdminSelect').value;
    const pwd = document.getElementById('splashAdminPassword').value;
    const errEl = document.getElementById('splashAdminError');
    
    if (!adminId) {
      errEl.textContent = 'Please select an admin profile.';
      errEl.style.display = 'block';
      return;
    }

    const adminObj = AppState.admins.find(a => a.id === adminId);
    if (!adminObj) {
      errEl.textContent = 'Incorrect password.';
      errEl.style.display = 'block';
      return;
    }
    
    hashPassword(pwd).then(hashedPwd => {
      if (adminObj.password !== hashedPwd) {
        errEl.textContent = 'Incorrect password.';
        errEl.style.display = 'block';
        return;
      }
      
      errEl.style.display = 'none';
      
      // Login successful
      document.getElementById('loginSplash').style.display = 'none';
      document.getElementById('appContainer').style.display = 'block';
      
      AppState.loggedInAs = 'admin';
      AppState.currentRole = 'admin';
      AppState.currentTrainerId = null;
      AppState.currentAdminId = adminId;
      document.getElementById('adminNav').style.display = 'block';
      document.getElementById('quickScheduleBtn').style.display = 'inline-flex';
      document.getElementById('roleSwitcher').style.display = 'inline-flex';
      switchView('dashboard');
    });
  });
    


  document.getElementById('splashAdminPassword').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') document.getElementById('splashAdminLoginBtn').click();
  });

  // Splash Screen - Trainer Selection
  document.getElementById('splashTrainerSelectBtn').addEventListener('click', () => {
    try {
      const sel = document.getElementById('trainerLoginSelect');
      const trainers = AppState.trainers || [];
      sel.innerHTML = '<option value="">— Select your profile —</option>' + 
        trainers.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('');
    } catch (err) {
    }
    document.getElementById('trainerLoginPassword').value = '';
    document.getElementById('trainerLoginError').style.display = 'none';
    openModal('trainerLoginModal');
  });

  // Role Switcher - allow Admin to switch to Trainer view for testing
  document.getElementById('roleSwitcher').addEventListener('change', (e) => {
    const role = e.target.value;
    if (role === 'trainer') {
      const sel = document.getElementById('trainerLoginSelect');
      sel.innerHTML = '<option value="">— Select your profile —</option>' + 
        AppState.trainers.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('');
      
      // If logged in as admin, we can skip password
      if (AppState.loggedInAs === 'admin') {
        document.getElementById('trainerLoginPassword').parentElement.style.display = 'none';
      } else {
        document.getElementById('trainerLoginPassword').parentElement.style.display = 'block';
      }
      
      document.getElementById('trainerLoginPassword').value = '';
      document.getElementById('trainerLoginError').style.display = 'none';
      openModal('trainerLoginModal');
      e.target.value = 'admin'; 
    } else {
      AppState.currentRole = 'admin';
      AppState.currentTrainerId = null;
      document.getElementById('adminNav').style.display = 'block';
      document.getElementById('trainerNav').style.display = 'none';
      document.getElementById('quickScheduleBtn').style.display = 'inline-flex';
      switchView('dashboard');
    }
  });

  document.getElementById('trainerLoginSelect').addEventListener('change', (e) => {
    const tid = e.target.value;
    const t = getTrainer(tid);
    const pwdLabel = document.getElementById('trainerLoginPasswordLabel');
    const confirmGroup = document.getElementById('trainerLoginConfirmGroup');
    const pwdInput = document.getElementById('trainerLoginPassword');
    
    if (t && AppState.loggedInAs !== 'admin') {
      if (!t.password) {
        pwdLabel.textContent = 'Create Password';
        confirmGroup.style.display = 'block';
        pwdInput.placeholder = 'Create a new password';
      } else {
        pwdLabel.textContent = 'Password';
        confirmGroup.style.display = 'none';
        pwdInput.placeholder = 'Enter password';
      }
    }
  });

  document.getElementById('trainerForgotPasswordBtn').addEventListener('click', (e) => {
    e.preventDefault();
    const tid = document.getElementById('trainerLoginSelect').value;
    const t = getTrainer(tid);
    if (!t) {
      showToast('Please select your profile first.', 'warning');
      return;
    }
    t.password = null; // Simulate reset
    showToast('A password reset link has been sent to your email! (Simulation: Password cleared)', 'success');
    document.getElementById('trainerLoginSelect').dispatchEvent(new Event('change'));
  });

  document.getElementById('cancelTrainerLoginBtn').addEventListener('click', () => {
    closeModal('trainerLoginModal');
  });

  document.getElementById('confirmTrainerLoginBtn').addEventListener('click', () => {
    const tid = document.getElementById('trainerLoginSelect').value;
    const pwdInput = document.getElementById('trainerLoginPassword').value;
    const confirmPwdInput = document.getElementById('trainerLoginConfirmPassword').value;
    const errEl = document.getElementById('trainerLoginError');
    if (!tid) return;
    
    const t = getTrainer(tid);
    if (!t) return;
    
    const proceedLogin = () => {
      // Login successful
      errEl.style.display = 'none';
      
      // Hide splash if we came from it
      if (document.getElementById('loginSplash').style.display !== 'none') {
        document.getElementById('loginSplash').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        AppState.loggedInAs = 'trainer';
      }
      
      AppState.currentRole = 'trainer';
      AppState.currentTrainerId = tid;
      document.getElementById('roleSwitcher').value = 'trainer';
      document.getElementById('adminNav').style.display = 'none';
      document.getElementById('trainerNav').style.display = 'block';
      document.getElementById('quickScheduleBtn').style.display = 'none';
      
      document.getElementById('roleSwitcher').style.display = AppState.loggedInAs === 'admin' ? 'inline-flex' : 'none';
      
      closeModal('trainerLoginModal');
      renderTrainerPortal();
      switchView('trainer-dashboard');
    };

    if (AppState.loggedInAs !== 'admin') {
      if (!t.password) {
        if (!pwdInput) {
          errEl.textContent = 'Password cannot be empty.';
          errEl.style.display = 'block';
          return;
        }
        if (pwdInput !== confirmPwdInput) {
          errEl.textContent = 'Passwords do not match.';
          errEl.style.display = 'block';
          return;
        }
        hashPassword(pwdInput).then(hashedPwd => {
          t.password = hashedPwd;
          showToast('Password created successfully!', 'success');
          proceedLogin();
        });
      } else {
        hashPassword(pwdInput).then(hashedPwd => {
          if (t.password !== hashedPwd) {
            errEl.textContent = 'Incorrect password.';
            errEl.style.display = 'block';
            return;
          }
          proceedLogin();
        });
      }
    } else {
      proceedLogin();
    }
  });

  // Sign Out
  document.getElementById('signOutBtn').addEventListener('click', () => {
    AppState.loggedInAs = null;
    AppState.currentRole = 'admin';
    AppState.currentTrainerId = null;
    document.getElementById('roleSwitcher').value = 'admin';
    document.getElementById('adminNav').style.display = 'block';
    document.getElementById('trainerNav').style.display = 'none';
    document.getElementById('quickScheduleBtn').style.display = 'inline-flex';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginSplash').style.display = 'flex';
    document.getElementById('splashAdminPassword').value = '';
    document.getElementById('trainerLoginPassword').value = '';
    document.getElementById('splashAdminError').style.display = 'none';
    document.getElementById('trainerLoginError').style.display = 'none';
    switchView('dashboard');
  });

  // Delete event
  document.getElementById('cancelEventBtn').addEventListener('click', cancelEvent);
  document.getElementById('deleteEventBtn').addEventListener('click', deleteEvent);
  document.getElementById('editEventBtn').addEventListener('click', () => {
    if (currentDetailEventId) editEvent(currentDetailEventId);
  });

  // Decline Class (trainer only)
  const declineClassBtn = document.getElementById('declineClassBtn');
  if (declineClassBtn) {
    declineClassBtn.addEventListener('click', () => {
      if (!currentDetailEventId) return;
      if (confirm('Are you sure you want to decline this class? The admin will be notified to reassign.')) {
        declineClass(currentDetailEventId);
      }
    });
  }

  // Unavailability modal
  const newUnavailabilityBtn = document.getElementById('newUnavailabilityBtn');
  if (newUnavailabilityBtn) {
    newUnavailabilityBtn.addEventListener('click', () => {
      document.getElementById('unavailabilityForm').reset();
      document.getElementById('unavailabilityId').value = '';
      document.getElementById('unavailabilityModalTitle').textContent = 'Add Leave/Busy';
      const delBtn = document.getElementById('deleteUnavailabilityBtn');
      if (delBtn) delBtn.style.display = 'none';
      openModal('unavailabilityModal');
    });
  }
  const unavailabilityForm = document.getElementById('unavailabilityForm');
  if (unavailabilityForm) unavailabilityForm.addEventListener('submit', saveUnavailability);
  const cancelUnavailabilityBtn = document.getElementById('cancelUnavailabilityBtn');
  if (cancelUnavailabilityBtn) cancelUnavailabilityBtn.addEventListener('click', () => closeModal('unavailabilityModal'));
  const closeUnavailabilityModal = document.getElementById('closeUnavailabilityModal');
  if (closeUnavailabilityModal) closeUnavailabilityModal.addEventListener('click', () => closeModal('unavailabilityModal'));

  // Request Cover Workflow
  document.getElementById('requestCoverBtn').addEventListener('click', () => {
    if (!currentDetailEventId) return;
    const ev = AppState.events.find(e => e.id === currentDetailEventId);
    if (!ev) return;
    
    const select = document.getElementById('coverRequestSelect');
    let html = '<option value="all">Broadcast to all authorised trainers</option>';
    const authTrs = authorisedTrainers(ev.lessonId);
    authTrs.forEach(t => {
      if (t.id !== AppState.currentTrainerId && !(ev.trainerIds || []).includes(t.id)) {
        html += `<option value="${t.id}">${escapeHTML(t.name)}</option>`;
      }
    });
    select.innerHTML = html;
    
    closeModal('eventDetailModal');
    openModal('requestCoverModal');
  });
  
  document.getElementById('cancelCoverBtn').addEventListener('click', () => {
    closeModal('requestCoverModal');
  });
  
  document.getElementById('confirmCoverBtn').addEventListener('click', () => {
    if (!currentDetailEventId) return;
    const ev = AppState.events.find(e => e.id === currentDetailEventId);
    if (ev) {
      ev.coverRequested = true;
      ev.coverRequestedBy = AppState.currentTrainerId || ev.trainerIds[0];
      ev.coverAdminRequested = !AppState.currentTrainerId;
      ev.coverRequestedTo = document.getElementById('coverRequestSelect').value;
      showToast('Cover request sent!', 'success');
    }
    closeModal('requestCoverModal');
    renderTrainerPortal();
  });

  // Overlay click to close
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // Assistant – run button
  document.getElementById('runAssistantBtn').addEventListener('click', runAssistant);

  // Assistant – click suggest slot to pre-fill schedule form
  document.getElementById('assistantResults').addEventListener('click', (e) => {
    const slot = e.target.closest('.suggest-slot');
    if (slot) {
      switchView('schedule');
      setTimeout(() => {
        const formDate = document.getElementById('formDate');
        if (formDate) {
          if (slot.dataset.lessonid) document.getElementById('formLesson').value = slot.dataset.lessonid;
          formDate.value = slot.dataset.date  || '';
          document.getElementById('formStartTime').value = slot.dataset.start || '';
          document.getElementById('formEndTime').value   = slot.dataset.end   || '';
          buildTrainerDropdown(slot.dataset.lessonid);
          updateFormAssistant();
          checkAvailability();
        }
      }, 80);
    }
  });

  // Keyboard – Escape to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
  });
};

