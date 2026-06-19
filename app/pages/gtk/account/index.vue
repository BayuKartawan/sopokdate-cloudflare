<script setup>
definePageMeta({
  middleware: [
    (to, from) => {
      return navigateTo("/akun/gtk/emis", { redirectCode: 301 });
    },
  ],
});
</script>
