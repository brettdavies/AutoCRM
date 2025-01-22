export const ticketRoutes = {
  list: '/ticket',
  create: '/ticket/new',
  view: (id: string) => `/ticket/${id}`,
  edit: (id: string) => `/ticket/${id}/edit`
}; 