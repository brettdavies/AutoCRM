export const ticketRoutes = {
  list: '/ticket',
  create: '/ticket/create',
  view: (id: string) => `/ticket/${id}`,
  edit: (id: string) => `/ticket/${id}/edit`
}; 