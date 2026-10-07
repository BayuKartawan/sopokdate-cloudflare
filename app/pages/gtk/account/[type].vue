<script setup>
definePageMeta({
  middleware: [
    () => {
      return navigateTo("/akun/gtk", { redirectCode: 301 });
    },
  ],
});
</script>
