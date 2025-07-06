import React, { useState, useMemo, useEffect, useRef } from 'react';

// --- Helper Functions & Hooks ---

// Helper function to format text to Title Case
const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};

// Custom Hook to debounce input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

// Function to identify major side effects based on keywords
const isMajorSideEffect = (effectName) => {
    const lowerCaseEffect = effectName.toLowerCase();
    const majorKeywords = [
        'anaphylactic', 'heart attack', 'myocardial infarction', 'stroke', 'cerebrovascular',
        'seizure', 'convulsion', 'hepatitis', 'liver failure', 'jaundice', 'kidney failure',
        'renal failure', 'bleeding', 'haemorrhage', 'blood clot', 'thrombosis', 'suicidal',
        'hallucination', 'psychosis', 'angioedema', 'respiratory depression', 'coma', 'death'
    ];
    return majorKeywords.some(keyword => lowerCaseEffect.includes(keyword));
};


// --- Components ---

// Header Component
const Header = () => (
  <header className="text-center p-6 md:p-8 bg-teal-500 rounded-t-xl no-print">
    <div className="flex justify-center items-center gap-4">
        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <title>InteractIQ Logo</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h1 className="text-4xl md:text-5xl font-bold text-white">InteractIQ</h1>
    </div>
    <p className="mt-3 text-md md:text-lg text-teal-100">
      Medication interactions, made simple.
    </p>
  </header>
);

// Definition Modal Component
const DefinitionModal = ({ term, definition, isLoading, onClose }) => {
    if (!term) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-teal-800">{toTitleCase(term)}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl font-light">&times;</button>
                </div>
                <div>
                    {isLoading ? (
                        <p className="text-gray-600">Loading definition...</p>
                    ) : (
                        <p className="text-gray-700">{definition}</p>
                    )}
                </div>
            </div>
        </div>
    );
};


// Medication Input Component with Predictive Text
const MedicationInput = ({ onAddMedication, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(inputValue, 300);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (debouncedSearchTerm.length > 2) {
      setIsSuggestionsLoading(true);
      fetch(`https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${debouncedSearchTerm}`)
        .then(response => response.json())
        .then(data => {
          setSuggestions(data.suggestionGroup.suggestionList?.suggestion || []);
        })
        .catch(error => {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
        })
        .finally(() => {
          setIsSuggestionsLoading(false);
        });
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);


  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    setSuggestions([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddMedication(inputValue.trim());
      setInputValue('');
      setSuggestions([]);
    }
  };

  return (
    <div className="p-4 relative" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g., Lipitor, Tylenol"
            className="w-full p-3 border-2 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            aria-label="Medication Name"
            disabled={isLoading}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="p-3 hover:bg-teal-100 cursor-pointer"
                >
                  {toTitleCase(suggestion)}
                </li>
              ))}
            </ul>
          )}
           {isSuggestionsLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">Loading...</div>}
        </div>
        <button
          type="submit"
          className="bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          disabled={isLoading || !inputValue.trim()}
        >
          {isLoading ? 'Loading...' : 'Add Medication'}
        </button>
      </form>
    </div>
  );
};

// Medication List Component
const MedicationList = ({ medications, onRemoveMedication }) => {
  if (medications.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <h2 className="text-xl font-semibold text-slate-700 mb-3">Your Medications:</h2>
      <ul className="flex flex-wrap gap-2">
        {medications.map(med => (
          <li
            key={med.id}
            className="flex items-center bg-teal-100 text-teal-800 rounded-full px-4 py-2 text-sm font-semibold"
          >
            <span>{toTitleCase(med.name)}</span>
            <button
              onClick={() => onRemoveMedication(med.id)}
              className="ml-2 text-red-500 hover:text-red-700 font-bold"
              aria-label={`Remove ${toTitleCase(med.name)}`}
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Side Effect Comparison Table Component
const SideEffectComparison = ({ medicationNames, sortedSideEffects, onDefine }) => {
  if (medicationNames.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500">
        <p>Add a medication to get started!</p>
      </div>
    );
  }

  return (
      <div className="p-4 overflow-x-auto">
        <table className="min-w-full bg-white border border-slate-200 rounded-lg shadow-md">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left text-sm font-semibold text-slate-600 border-b-2 border-slate-200">Side Effect</th>
              <th className="p-3 text-center text-sm font-semibold text-slate-600 border-b-2 border-slate-200">Risk</th>
              {medicationNames.map(name => (
                <th key={name} className="p-3 text-center text-sm font-semibold text-slate-600 border-b-2 border-slate-200">
                  {toTitleCase(name)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedSideEffects.map((effect, index) => (
              <tr key={effect.name} className="border-t border-slate-200">
                <td className="p-3 text-slate-700">
                  <button 
                    onClick={() => onDefine(effect.name)} 
                    className={`hover:underline text-left ${effect.major ? 'text-red-600 font-bold' : 'text-teal-600'}`}
                  >
                    {toTitleCase(effect.name)}
                  </button>
                </td>
                <td className="p-3 text-center font-semibold">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                        effect.count > 1 ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                        {effect.count > 1 ? `${effect.count} Meds` : `1 Med`}
                    </span>
                </td>
                {medicationNames.map(name => (
                  <td key={`${name}-${effect.name}`} className="p-3 text-center text-slate-700">
                    {effect.meds.includes(name) ?
                      <span className="text-green-500 font-bold text-xl" role="img" aria-label="Yes">✓</span> :
                      <span className="text-red-400 font-bold" role="img" aria-label="No">-</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
};

// Doctor Summary Component
const DoctorSummary = ({ medications, sortedSideEffects }) => {
    if (medications.length < 1) return null;

    const topMajor = sortedSideEffects.filter(e => e.major).slice(0, 3);
    const topOverlapping = sortedSideEffects.filter(e => e.count > 1).slice(0, 3);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4">
            <div id="summary-to-print" className="p-6 bg-sky-50 border-2 border-sky-200 rounded-lg">
                <h2 className="text-2xl font-bold text-sky-800 mb-4">Your InteractIQ Summary</h2>
                <p className="mb-4 text-slate-700">This is a summary of potential side effects based on the medications you've entered. Use this as a starting point for a conversation with your healthcare provider.</p>
                
                <h3 className="font-bold text-lg text-sky-700 mt-4 mb-2">Medications Entered:</h3>
                <ul className="list-disc list-inside text-slate-700">
                    {medications.map(med => <li key={med.id}>{toTitleCase(med.name)}</li>)}
                </ul>

                {topMajor.length > 0 && (
                    <>
                        <h3 className="font-bold text-lg text-red-600 mt-4 mb-2">Key Major Side Effects to Discuss:</h3>
                        <ul className="list-disc list-inside text-slate-700">
                            {topMajor.map(effect => <li key={effect.name}>{toTitleCase(effect.name)}</li>)}
                        </ul>
                    </>
                )}

                {topOverlapping.length > 0 && (
                    <>
                        <h3 className="font-bold text-lg text-amber-700 mt-4 mb-2">Potential Overlapping Side Effects:</h3>
                        <ul className="list-disc list-inside text-slate-700">
                            {topOverlapping.map(effect => <li key={effect.name}>{toTitleCase(effect.name)} (found in {effect.count} medications)</li>)}
                        </ul>
                    </>
                )}

                <h3 className="font-bold text-lg text-sky-700 mt-4 mb-2">Questions You Might Ask:</h3>
                <ul className="list-disc list-inside text-slate-700">
                    <li>Based on my current medications, are there any interactions I should be particularly aware of?</li>
                    <li>What are the most common side effects I should expect?</li>
                    <li>Are there any "red flag" symptoms that mean I should call you immediately?</li>
                </ul>
            </div>
            <div className="text-center mt-4 no-print">
                <button onClick={handlePrint} className="bg-sky-600 text-white font-bold py-2 px-5 rounded-lg shadow hover:bg-sky-700 transition-colors">
                    Print Summary
                </button>
            </div>
        </div>
    );
};


// Disclaimer Component
const Disclaimer = () => (
    <div className="p-4 m-4 bg-slate-200 border-l-4 border-slate-500 text-slate-800 rounded-r-lg no-print">
        <h3 className="font-bold">Disclaimer</h3>
        <p className="text-sm">
            This tool is for informational purposes only and is not a substitute for professional medical advice. The "major" and "risk" classifications are based on keywords and overlap, not a clinical assessment. Always consult with a healthcare professional for any health concerns or before making any decisions related to your medication.
        </p>
    </div>
);


// Main App Component
export default function App() {
  const [medications, setMedications] = useState([]);
  const [sideEffectsData, setSideEffectsData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalData, setModalData] = useState({ term: null, definition: '', isLoading: false });

  // Lifted state calculation for side effects
  const { sortedSideEffects, medicationNames } = useMemo(() => {
    const allEffects = new Map();
    const medNames = medications.map(med => med.name);
    
    medNames.forEach(name => {
      const effects = sideEffectsData[name]?.effects;
      if (effects) {
        effects.forEach(effect => {
            if (allEffects.has(effect.name)) {
                const existing = allEffects.get(effect.name);
                existing.count++;
                existing.meds.push(name);
                if (effect.major) existing.major = true;
            } else {
                allEffects.set(effect.name, { 
                    name: effect.name, 
                    major: effect.major,
                    count: 1,
                    meds: [name]
                });
            }
        });
      }
    });

    const sorted = Array.from(allEffects.values()).sort((a, b) => {
        if (a.major && !b.major) return -1;
        if (!a.major && b.major) return 1;
        if (a.count > b.count) return -1;
        if (a.count < b.count) return 1;
        return a.name.localeCompare(b.name);
    });

    return {
      sortedSideEffects: sorted,
      medicationNames: medNames
    };
  }, [medications, sideEffectsData]);


  const fetchSideEffects = async (medicationName) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `https://api.fda.gov/drug/event.json?search=patient.drug.openfda.brand_name:"${medicationName.toLowerCase()}"&limit=10&count=patient.reaction.reactionmeddrapt.exact`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Could not fetch data for ${toTitleCase(medicationName)}. Please check the spelling or try a different name.`);
      }
      const data = await response.json();
      
      const effects = data.results ? data.results
          .filter(result => result.term.toLowerCase() !== 'off label use')
          .map(result => ({
              name: result.term,
              major: isMajorSideEffect(result.term)
      })) : [];
      
      if (effects.length === 0) {
          setError(`No common side effects found for ${toTitleCase(medicationName)}. It might be an over-the-counter drug or have a different brand name.`);
      }

      setSideEffectsData(prevData => ({
        ...prevData,
        [medicationName.toLowerCase()]: { effects }
      }));

    } catch (err) {
      setError(err.message);
      setMedications(prevMeds => prevMeds.filter(med => med.name !== medicationName.toLowerCase()));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMedication = (name) => {
    const normalizedName = name.toLowerCase();
    if (!medications.some(med => med.name === normalizedName)) {
      const newMedication = { id: Date.now(), name: normalizedName };
      setMedications(prevMeds => [...prevMeds, newMedication]);
      fetchSideEffects(name);
    }
  };

  const handleRemoveMedication = (id) => {
    const medicationToRemove = medications.find(med => med.id === id);
    if (medicationToRemove) {
      setMedications(meds => meds.filter(med => med.id !== id));
      setSideEffectsData(prevData => {
        const newData = { ...prevData };
        delete newData[medicationToRemove.name];
        return newData;
      });
    }
  };
  
  const fetchDefinition = async (term) => {
    setModalData({ term, definition: '', isLoading: true });
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${term.toLowerCase()}`);
      if (response.ok) {
        const data = await response.json();
        const definition = data[0]?.meanings[0]?.definitions[0]?.definition;
        if (definition) {
            setModalData({ term, definition, isLoading: false });
        } else {
            setModalData({ term, definition: `No simple definition found for "${toTitleCase(term)}". This may be a complex medical term.`, isLoading: false });
        }
      } else {
        setModalData({ term, definition: `No standard dictionary definition found for "${toTitleCase(term)}".`, isLoading: false });
      }
    } catch (error) {
      console.error("A network error occurred while fetching definition:", error);
      setModalData({ term, definition: `Could not load definition for "${toTitleCase(term)}". Please check your internet connection.`, isLoading: false });
    }
  };

  const handleCloseModal = () => {
    setModalData({ term: null, definition: '', isLoading: false });
  };

  return (
    <>
        <style>{`
            @media print {
                .no-print {
                    display: none !important;
                }
                body * {
                    visibility: hidden;
                }
                #summary-to-print, #summary-to-print * {
                    visibility: visible;
                }
                #summary-to-print {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    border: none !important;
                }
            }
        `}</style>
        <div className="bg-slate-100 min-h-screen font-sans">
          <div className="container mx-auto p-4 max-w-4xl">
            <div className="bg-white rounded-xl shadow-lg">
              <Header />
              <main>
                <div className="no-print">
                    <MedicationInput onAddMedication={handleAddMedication} isLoading={isLoading} />
                    {error && <p className="text-red-500 text-center px-4 py-2">{error}</p>}
                    <MedicationList medications={medications} onRemoveMedication={handleRemoveMedication} />
                </div>
                <SideEffectComparison 
                    medicationNames={medicationNames}
                    sortedSideEffects={sortedSideEffects}
                    onDefine={fetchDefinition}
                />
                <DoctorSummary
                    medications={medications}
                    sortedSideEffects={sortedSideEffects}
                />
                <Disclaimer />
              </main>
            </div>
          </div>
          <DefinitionModal 
            term={modalData.term}
            definition={modalData.definition}
            isLoading={modalData.isLoading}
            onClose={handleCloseModal}
          />
        </div>
    </>
  );
}
