// @ts-check
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './credentials.js';

// index.html maps this to "./supabase-shim.js" ...
import { SupabaseClient } from '@supabase/supabase-js';

// @ts-ignore
const createClient = window.supabase.createClient;

import './types.js';

// Initialize Supabase client
const /** @type {SupabaseClient} */ supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }
    }
);


// Generate or retrieve user ID from cookie
const getUserId = () => {
    const cookieName = 'survey_user_id';
    let userId = document.cookie
        .split('; ')
        .find(row => row.startsWith(cookieName))
        ?.split('=')[1];

    if (!userId) {
        userId = crypto.randomUUID();
        document.cookie = `${cookieName}=${userId}; max-age=31536000; path=/`;
    }

    return userId;
};

/** @type {string} */
const userId = getUserId();

// Load previous responses
const loadPreviousResponses = async () => {
    try {
        const { data, error } = await supabase
            .from('survey_responses')
            .select()
            .eq('user_id', userId);
            // .single();

        if (error) {
            console.error('Error loading previous responses:', error);
            if (error.code === '406') {
                console.error('Content negotiation failed. Check headers and data format.');
            } else if (error.message?.includes('CORS')) {
                alert('CORS error detected. Please check Supabase configuration.');
            }
            return;
        }

        if (data.length) {
            const /** @type {SurveyResponse} */ response = data[0];
            console.log('got reponse', response);
            /** @type {HTMLSelectElement} */
            (document.getElementById('profession')).value = response.profession;
            /** @type {HTMLSelectElement} */
            (document.getElementById('ageRange')).value = response.age_range;
            /** @type {HTMLInputElement} */
            (document.getElementById('aiKnowledge')).value = response.ai_knowledge.toString();

            const previousExperiments = response.previous_experiments || [];
            previousExperiments.forEach(expNum => {
                /** @type {HTMLInputElement} */
                (document.getElementById(`exp${expNum}`)).checked = true;
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

// Submit survey responses
const submitSurvey = async () => {
    try {
        /** @type {number[]} */
        const previousExperiments = [1, 2, 3, 4]
            .filter(num => /** @type {HTMLInputElement} */
                (document.getElementById(`exp${num}`)).checked);

        /** @type {SurveyResponse} */
        const response = {
            user_id: userId,
            profession: /** @type {HTMLSelectElement} */
                (document.getElementById('profession')).value,
            age_range: /** @type {HTMLSelectElement} */
                (document.getElementById('ageRange')).value,
            ai_knowledge: parseInt(/** @type {HTMLInputElement} */
                (document.getElementById('aiKnowledge')).value),
            previous_experiments: previousExperiments,
            submitted_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('survey_responses')
            .upsert({ ...response });

        if (error) {
            console.error('Error submitting survey:', error);
            if (error.message?.includes('CORS')) {
                alert('CORS error detected. Please check Supabase configuration.');
            } else {
                alert('Error submitting survey. Please try again.');
            }
        } else {
            alert('Survey submitted successfully!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An unexpected error occurred.');
    }
};

// Subscribe to real-time updates
const subscribeToUpdates = () => {
    const channel = supabase
        .channel('survey_responses')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'survey_responses' },
            updateResults)
        .subscribe();
};

// Update results view
const updateResults = async () => {
    const { data, error } = await supabase
        .from('survey_responses')
        .select();

    if (error) {
        console.error('Error fetching results:', error);
        return;
    }

    const results = {
        professions: {},
        ageRanges: {},
        aiKnowledge: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        experiments: { 1: 0, 2: 0, 3: 0, 4: 0 }
    };

    data.forEach(/** @type {SurveyResponse} */ (response) => {
      const /** @type {SurveyResponse} */ r = response;
        // Count professions
        results.professions[response.profession] =
            (results.professions[response.profession] || 0) + 1;

        // Count age ranges
        results.ageRanges[response.age_range] =
            (results.ageRanges[response.age_range] || 0) + 1;

        // Count AI knowledge levels
        results.aiKnowledge[response.ai_knowledge]++;

        // Count previous experiments
        response.previous_experiments.forEach(expNum => {
            results.experiments[expNum]++;
        });
    });

    // Display results
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <h3>Total Responses: ${data.length}</h3>

            <h4>Professions:</h4>
            <ul>${Object.entries(results.professions)
                .map(([prof, count]) =>
                    `<li>${prof}: ${count} (${Math.round(count / data.length * 100)}%)</li>`)
                .join('')}</ul>

            <h4>Age Ranges:</h4>
            <ul>${Object.entries(results.ageRanges)
                .map(([range, count]) =>
                    `<li>${range}: ${count} (${Math.round(count / data.length * 100)}%)</li>`)
                .join('')}</ul>

            <h4>AI Knowledge Levels:</h4>
            <ul>${Object.entries(results.aiKnowledge)
                .map(([level, count]) =>
                    `<li>Level ${level}: ${count} (${Math.round(count / data.length * 100)}%)</li>`)
                .join('')}</ul>

            <h4>Previous Experiments:</h4>
            <ul>${Object.entries(results.experiments)
                .map(([expNum, count]) =>
                    `<li>Experiment #${expNum}: ${count} (${Math.round(count / data.length * 100)}%)</li>`)
                .join('')}</ul>
        `;
    }
};

// Initialize application
const init = async () => {
    // Check if this is the results view
    const urlParams = new URLSearchParams(window.location.search);
    const isResultsView = urlParams.get('view') === 'results';

    if (isResultsView) {
        /** @type {HTMLElement} */
        (document.getElementById('surveyForm')).style.display = 'none';
        /** @type {HTMLElement} */
        (document.getElementById('resultsView')).style.display = 'block';
        await updateResults();
        subscribeToUpdates();
    } else {
        await loadPreviousResponses();
        document.getElementById('submitSurvey')
            ?.addEventListener('click', submitSurvey);
    }
};

init();