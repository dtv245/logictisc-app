import React, { lazy, Suspense } from "react";
import { Card, Skeleton, Space } from "antd";
import type { OptimizationCandidate } from "@/types/optimization.dto";

const CandidateRouteMap = lazy(() => import("./CandidateRouteMap"));
const CandidateHosTimeline = lazy(() => import("./CandidateHosTimeline"));

export interface CandidateVisualizationsProps {
  candidate: OptimizationCandidate | null;
}

export const CandidateVisualizations: React.FC<CandidateVisualizationsProps> = ({
  candidate,
}) => {
  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* 1. Timeline HOS */}
      <div>
        <Suspense
          fallback={
            <Card bordered style={{ width: "100%" }}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>
          }
        >
          <CandidateHosTimeline candidate={candidate} />
        </Suspense>
      </div>

      {/* 2. Bản đồ lộ trình */}
      <div>
        <Suspense
          fallback={
            <Card bordered style={{ width: "100%", height: 420 }}>
              <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
          }
        >
          <CandidateRouteMap candidate={candidate} />
        </Suspense>
      </div>
    </Space>
  );
};

export default CandidateVisualizations;
