import React from 'react';
import SettlementReviewMode from '../../components/settlement/SettlementReviewMode';

/**
 * A demonstration page for the case study.  This route renders a mocked
 * settlement for a standard Vs deal so that stakeholders can experience
 * the review mode without navigating through the entire product.
 */
const CaseStudyPage: React.FC = () => {
  // Mocked settlement data.  In a real application you would load this from
  // the database using getServerSideProps or similar.  The values here are
  // chosen to illustrate both guarantee and net winning scenarios depending
  // on the recoups.
  const settlement = {
    gross: 12000,
    expenses: [
      { category: 'Production', amount: 2500 },
      { category: 'Hospitality', amount: 400 },
      { category: 'Marketing', amount: 200 },
    ],
    recoups: [
      { category: 'Marketing', amount: 200, status: 'disputed' as const },
    ],
    notes_freetext: 'Vs deal: $5k vs 80% of net after expenses. Marketing recoup to be applied.',
    guarantee_amount: 5000,
    percentage: 0.8,
  };
  return (
    <div className="flex flex-col items-center justify-start p-8">
      <h1 className="text-2xl font-bold mb-4">Case Study: Settlement Review Mode</h1>
      <p className="mb-6 max-w-2xl text-sm text-gray-700">
        This page demonstrates the prototype settlement review mode for standard
        guarantee-versus-net deals.  The calculation, breakdown and tour manager
        note below are generated from mocked settlement data.
      </p>
      <SettlementReviewMode {...settlement} />
    </div>
  );
};

export default CaseStudyPage;
