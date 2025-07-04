package org.example.traffic;


public class QueryCountHolder {
    private static final ThreadLocal<Integer> queryCount = ThreadLocal.withInitial(() -> 0);

    public static void increment() {
        queryCount.set(queryCount.get() + 1);
    }

    public static int getCount() {
        return queryCount.get();
    }

    public static void reset() {
        queryCount.remove();
    }
}
