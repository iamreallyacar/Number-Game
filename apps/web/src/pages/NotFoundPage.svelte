<script lang="ts">
  import { routePath } from '../routing/routes.js';
</script>

<h1>Page not found</h1>
<p>
  There is nothing at this address. <a href={routePath({ page: 'dashboard' })}
    >Go to the dashboard</a
  >.
</p>
