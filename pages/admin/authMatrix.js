/* ================================================================
   13. AUTHORISATION MATRIX RENDER
   ================================================================ */
const renderMatrix = () => {
  const wrapper = document.querySelector('.matrix-table-wrapper');
  if (!wrapper) return;
  const trainers = AppState.trainers;
  const lessons  = AppState.lessons;
  const topics   = AppState.topics || [];

  let html = '';

  topics.forEach(topic => {
    const topicLessons = lessons.filter(l => l.topicId === topic.id);
    if (topicLessons.length === 0) return;

    // Determine which trainers are authorised for at least one lesson in this topic
    const validTrainers = trainers.filter(t => {
      return topicLessons.some(l => (AppState.authMatrix[l.id] || []).includes(t.id));
    });

    if (validTrainers.length === 0) {
      html += `<div style="margin-bottom: 32px; background:#fff; padding:16px; border-radius:12px; border:1px solid var(--border);">
                 <h2 style="font-size:16px; margin:0 0 8px 0; color:var(--gray-900);">${escapeHTML(topic.name)}</h2>
                 <p style="font-size:13px; color:var(--gray-500); margin:0;">No trainers authorised for modules under this topic.</p>
               </div>`;
      return;
    }

    let tableHtml = `<div style="margin-bottom: 32px; background:#fff; padding:24px; border-radius:12px; border:1px solid var(--border); box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <h2 style="font-size:18px; margin:0 0 16px 0; color:var(--brand-700);">${escapeHTML(topic.name)}</h2>
      <div style="overflow-x:auto;">
      <table class="matrix-table" style="margin-bottom:0;">
        <thead>
          <tr>
            <th style="min-width: 200px;">Module</th>`;
            
    validTrainers.forEach(t => { tableHtml += `<th style="text-align:center;">${escapeHTML(t.name)}</th>`; });
    
    tableHtml += `</tr></thead><tbody>`;

    topicLessons.forEach(l => {
      tableHtml += `<tr><td>${l.name}</td>`;
      validTrainers.forEach(t => {
        const auth = (AppState.authMatrix[l.id] || []).includes(t.id);
        tableHtml += `<td style="text-align:center;">${auth
          ? '<span class="matrix-check">✓</span>'
          : '<span class="matrix-x" style="color:var(--gray-300);">—</span>'
        }</td>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += `</tbody></table></div></div>`;
    html += tableHtml;
  });

  if (html === '') {
    html = `<div style="padding:24px; color:var(--gray-500);">No topics/modules found.</div>`;
  }

  wrapper.innerHTML = html;
};



// --- Auto-generated globals for Vite migration ---
window.saveTopic = saveTopic;
window.renderMatrix = renderMatrix;
window.updateTrainerCoursesLabel = updateTrainerCoursesLabel;
window.updateLessonPrerequisiteLabel = updateLessonPrerequisiteLabel;
window.saveTrainer = saveTrainer;
window.renderLessons = renderLessons;
window.showClassroomSchedule = showClassroomSchedule;
window.saveAdmin = saveAdmin;
window.buildTrainerCoursesDropdown = buildTrainerCoursesDropdown;
window.buildLessonTrainerDropdown = buildLessonTrainerDropdown;
window.saveClassroom = saveClassroom;
window.buildLessonPrerequisiteDropdown = buildLessonPrerequisiteDropdown;
window.renderTrainers = renderTrainers;
window.renderClassrooms = renderClassrooms;
window.saveLesson = saveLesson;
window.renderReusableWeekGrid = renderReusableWeekGrid;
