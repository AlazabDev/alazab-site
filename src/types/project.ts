// src/types/project.ts
export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  progress: number | null;
  client_name: string | null;
  budget: number | null;
  model3d_url: string | null;
  area: string | null;
  assigned_to: string | null;
  category: string | null;
  engineer_name: string | null;
  image: string | null;
  location: string | null;
  notes: string | null;
  order_number: string | null;
  project_number: string | null;
  tags: string | null;
  work_type: string | null;
}
